/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@angular/core';
import { FunctionScript } from '../../interfaces/function-script.interface';
import { ScriptStorageStrategy } from '../../interfaces/script-storage.strategy.interface';

@Injectable({
  providedIn: 'root',
})
export class FirebaseScriptStorageService implements ScriptStorageStrategy {
  save(script: FunctionScript): Promise<void> {
    throw new Error('Method not implemented.');
  }
  get(id: string): Promise<FunctionScript | null> {
    throw new Error('Method not implemented.');
  }
  getAll(): Promise<FunctionScript[]> {
    throw new Error('Method not implemented.');
  }
  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  // constructor(private firestore: Firestore) {}

  // async save(script: FunctionScript): Promise<void> {
  //   const scriptRef = doc(this.firestore, 'scripts', script.id);
  //   await setDoc(scriptRef, script);
  // }

  // async get(id: string): Promise<FunctionScript | null> {
  //   const scriptRef = doc(this.firestore, 'scripts', id);
  //   const docSnap = await getDoc(scriptRef);
  //   return docSnap.exists() ? (docSnap.data() as FunctionScript) : null;
  // }

  // async getAll(): Promise<FunctionScript[]> {
  //   const querySnapshot = await getDocs(collection(this.firestore, 'scripts'));
  //   return querySnapshot.docs.map((doc) => doc.data() as FunctionScript);
  // }

  // async delete(id: string): Promise<void> {
  //   const scriptRef = doc(this.firestore, 'scripts', id);
  //   await deleteDoc(scriptRef);
  // }
}
