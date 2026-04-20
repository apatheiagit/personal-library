import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookService } from '../../core/services/book.service';
import { ReadingStatus } from '../../core/models/book.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.css']
})
export class BookFormComponent implements OnInit {
  public router = inject(Router);
  public bookService = inject(BookService);
  bookForm: FormGroup;
  isEditMode = false;
  bookId: string | null = null;
  loading = false;
  ReadingStatus = ReadingStatus;
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  constructor() {
    this.bookForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
      author: ['', [Validators.required, Validators.minLength(2)]],
      year: [null, [Validators.min(0), Validators.max(new Date().getFullYear())]],
      status: [ReadingStatus.READ, Validators.required],
      rating: [null],
      personalReview: ['']
    });
  }

  ngOnInit(): void {
    this.bookId = this.route.snapshot.paramMap.get('id');
    if (this.bookId) {
      this.isEditMode = true;
      this.loadBook();
    }

    this.bookForm.get('status')?.valueChanges.subscribe(status => {
      this.toggleRatingReviewFields(status);
    });
  }

  loadBook(): void {
    this.loading = true;
    this.bookService.getBookById(this.bookId!).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (book) => {
        this.bookForm.patchValue({
          title: book.title,
          author: book.author,
          year: book.year,
          status: book.status,
          rating: book.rating || null,
          personalReview: book.personalReview || ''
        });
        this.toggleRatingReviewFields(book.status);
      },
      error: (error) => {
        console.error('Ошибка загрузки книги:', error);
        alert('Не удалось загрузить книгу');
      }
    });
  }

  toggleRatingReviewFields(status: ReadingStatus): void {
    const ratingControl = this.bookForm.get('rating');
    const reviewControl = this.bookForm.get('personalReview');
    
    if (status === ReadingStatus.READ) {
      ratingControl?.setValidators([Validators.min(1), Validators.max(5)]);
      reviewControl?.setValidators([]);
    } else {
      ratingControl?.clearValidators();
      reviewControl?.clearValidators();
      ratingControl?.setValue(null);
      reviewControl?.setValue('');
    }
    
    ratingControl?.updateValueAndValidity();
    reviewControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.bookForm.invalid) {
      Object.keys(this.bookForm.controls).forEach(key => {
        const control = this.bookForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formValue = this.bookForm.value;
    
    if (formValue.status !== ReadingStatus.READ) {
      formValue.rating = undefined;
      formValue.personalReview = undefined;
    }

    this.loading = true;

    if (this.isEditMode && this.bookId) {
      this.bookService.getBookById(this.bookId).subscribe(book => {
        const updatedBook = { ...book, ...formValue };
        this.bookService.updateBook(this.bookId!, updatedBook).pipe(
          finalize(() => this.loading = false)
        ).subscribe({
          next: () => {
            alert('Книга успешно обновлена!');
            this.router.navigate(['/books']);
          },
          error: (error) => {
            console.error('Ошибка обновления:', error);
            alert('Ошибка при обновлении книги');
          }
        });
      });
    } else {
      this.bookService.addBook(formValue).pipe(
        finalize(() => this.loading = false)
      ).subscribe({
        next: () => {
          alert('Книга успешно добавлена!');
          this.router.navigate(['/books']);
        },
        error: (error) => {
          console.error('Ошибка добавления:', error);
          alert('Ошибка при добавлении книги');
        }
      });
    }
  }

  get f() {
    return this.bookForm.controls;
  }
}