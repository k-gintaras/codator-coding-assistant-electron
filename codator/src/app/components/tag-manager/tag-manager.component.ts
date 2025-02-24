import { NgFor } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TagOLDService } from '../../services/tag.service';
import { Tag } from '../../services/assistants-api/tag.service';

@Component({
  selector: 'app-tag-manager',
  standalone: true,
  imports: [NgFor, FormsModule],
  templateUrl: './tag-manager.component.html',
  styleUrl: './tag-manager.component.scss',
})
export class TagManagerComponent implements OnChanges {
  @Output() tagChange = new EventEmitter<string[]>();
  @Output() tagDelete = new EventEmitter<string>();
  @Output() tagsLoaded = new EventEmitter<Tag[]>();

  @Input() entityId = '';
  @Input() entityType = 'memory';
  tags: Tag[] = [];
  tagInput = '';

  constructor(private tagService: TagOLDService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityId'] || changes['entityType']) {
      this.tags = [];
      if (!this.entityId) return;
      if (!this.entityType) return;
      this.getTags();
    }
  }

  onTagInputChange(): void {
    const cleanedTags = this.cleanTags(this.tagInput); // Clean tags
    this.tagChange.emit(cleanedTags); // Emit the cleaned tags
  }

  // Function to clean the tags
  private cleanTags(input: string): string[] {
    return input
      .split(',')
      .map((tag) => tag.trim()) // Remove extra spaces
      .filter((tag) => tag.length > 0); // Remove empty tags
  }

  // ngOnInit(): void {
  //   //this.getTags();
  // }

  getTags(): void {
    this.tagService
      .getTagsByEntity(this.entityType, this.entityId)
      .subscribe((tags) => {
        if (!tags) return;
        this.tags = tags;
        this.tagsLoaded.emit(tags);
      });
  }

  addTag(): void {
    const tagOrTags = this.tagInput.split(',');
    const cleanTags = tagOrTags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    const tagString = cleanTags.join(',');
    if (tagString.length > 0) {
      const isName = false; // Can adjust based on user input

      if (this.entityId.length < 1) {
        return;
      }
      // we have id, we can simply add to it
      this.tagService
        .addTagToEntity(this.entityType, this.entityId, tagString, isName)
        .subscribe((success) => {
          if (success) {
            this.getTags(); // Refresh tags after adding
          }
        });
    }
  }

  removeTag(tagId: string): void {
    if (this.entityId.length < 1) {
      // we are just passing it to parent
      this.tagDelete.emit(tagId);
      return;
    }
    this.tagService
      .removeTagFromEntity(this.entityType, this.entityId, tagId)
      .subscribe((success) => {
        if (success) {
          this.getTags(); // Refresh tags after removing
        }
      });
  }
}
