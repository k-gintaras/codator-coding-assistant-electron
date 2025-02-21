import { Component, Input } from '@angular/core';
import {
  FeedbackService,
  Feedback,
} from '../../services/assistants-api/feedback.service';
import { NgClass, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgFor, NgClass, FormsModule],
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss',
})
export class FeedbackComponent {
  @Input() assistant!: { id: string; name: string }; // Assistant data input

  rating = 0; // Stores selected rating (1-5)
  comment = ''; // Stores feedback comment
  submitting = false; // Prevents duplicate submissions

  constructor(private feedbackService: FeedbackService) {}

  setRating(value: number) {
    this.rating = value;
  }

  async submitFeedback() {
    if (this.rating === 0) return; // Prevent submitting without rating

    this.submitting = true;
    const feedback: Feedback = {
      id: '', // Will be generated server-side
      targetId: this.assistant.id,
      targetType: 'assistant',
      rating: this.rating,
      comments: this.comment.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const feedbackId = await this.feedbackService.createFeedback(feedback);

    if (feedbackId) {
      console.log('Feedback submitted:', feedbackId);
      this.resetForm();
    } else {
      console.error('Error submitting feedback');
    }
    this.submitting = false;
  }

  resetForm() {
    this.rating = 0;
    this.comment = '';
  }
}
