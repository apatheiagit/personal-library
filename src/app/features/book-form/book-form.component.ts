import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, filter, finalize, map, shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BookService } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';
import { Book, Rating, ReadingStatus } from '../../core/models/book.model';
import { ErrorDisplayComponent } from '../../shared/error-display/error-display.component';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ErrorDisplayComponent,
    MatButtonModule, MatSelectModule, MatInputModule, MatFormFieldModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookFormComponent implements OnDestroy {
  public router = inject(Router);
  public bookService = inject(BookService);
  bookForm: FormGroup;
  ReadingStatus = ReadingStatus;
  private destroy$ = new Subject<void>();

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  private bookId$ = this.route.paramMap.pipe(
    map(params => params.get('id')),
  );
  
  isEditMode$ = this.bookId$.pipe(
    map(id => !!id),
    shareReplay(1),
  );
  
  bookToEdit$ = combineLatest([this.bookId$, this.isEditMode$]).pipe(
    filter(([id, isEdit]) => isEdit && !!id),
    switchMap(([id]) => this.bookService.getBookById(id!)),
    shareReplay(1),
  );
  
  loading$ = new Subject<boolean>();
  
  validationErrors$: unknown;

  constructor() {
    this.bookForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      year: [null, [Validators.min(0), Validators.max(new Date().getFullYear())]],
      status: [ReadingStatus.READ, Validators.required],
      rating: [null],
      personalReview: [''],
    });
    this.loadBookIfEditMode();
    this.setupStatusListener();
    this.setupAutoSave();
    this.validationErrors$ = this.bookForm.statusChanges.pipe(
      startWith(this.bookForm.status),
      map(() => {
        const errors: any = {};
        Object.keys(this.bookForm.controls).forEach(key => {
          const control = this.bookForm.get(key);
          if (control?.invalid && control?.touched) {
            errors[key] = control.errors;
          }
        });
        return errors;
      }),
    );
  }

  private loadBookIfEditMode(): void {
    this.bookToEdit$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(book => {
      this.bookForm.patchValue({
        title: book.title,
        author: book.author,
        year: book.year,
        status: book.status,
        rating: book.rating || null,
        personalReview: book.personalReview || '',
      });
      this.toggleRatingReviewFields(book.status);
    });
  }

  private setupStatusListener(): void {
    this.bookForm.get('status')?.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe(status => {
      this.toggleRatingReviewFields(status);
    });
  }

  private setupAutoSave(): void {
    this.bookForm.valueChanges.pipe(
      filter(() => this.bookForm.valid),
      debounceTime(30000),
      takeUntil(this.destroy$),
    ).subscribe(formValue => {
      if (formValue.title && formValue.author) {
        localStorage.setItem('book_draft', JSON.stringify(formValue));
        console.log('Черновик сохранен');
      }
    });
    
    const draft = localStorage.getItem('book_draft');
    if (draft && !this.route.snapshot.paramMap.get('id')) {
      const draftData = JSON.parse(draft);
      if (confirm('Найден несохраненный черновик. Загрузить?')) {
        this.bookForm.patchValue(draftData);
      }
    }
  }

  toggleRatingReviewFields(status: ReadingStatus): void {
    const ratingControl = this.bookForm.get('rating');
    const reviewControl = this.bookForm.get('personalReview');
    
    if (status === ReadingStatus.READ) {
      ratingControl?.setValidators([Validators.required, Validators.min(1), Validators.max(5)]);
      reviewControl?.setValidators([Validators.maxLength(1000)]);
    } else {
      ratingControl?.clearValidators();
      reviewControl?.clearValidators();
      ratingControl?.setValue(null);
      reviewControl?.setValue('');
    }
    
    ratingControl?.updateValueAndValidity();
    reviewControl?.updateValueAndValidity();
  }

  setRating(rating: number): void {
    this.bookForm.get('rating')?.setValue(rating as Rating);
  }

  onSubmit(): void {
    if (this.bookForm.invalid) {
      this.markAllTouched();
      this.toastService.warning(
        'Не заполнены поля',
        'Пожалуйста, заполните все обязательные поля',
      );
      return;
    }

    const formValue = this.bookForm.value;
    const bookTitle = formValue.title;
    
    if (formValue.status !== ReadingStatus.READ) {
      delete formValue.rating;
    }

    this.loading$.next(true);

    this.isEditMode$.pipe(takeUntil(this.destroy$)).subscribe(isEdit => {
      if (isEdit) {
        this.bookId$.pipe(
          takeUntil(this.destroy$),
          switchMap(id => this.bookService.getBookById(id!)),
          switchMap(book => this.bookService.updateBook(book.id, { ...book, ...formValue })),
        ).subscribe({
          next: () => {
            this.loading$.next(false);
            localStorage.removeItem('book_draft');
            this.toastService.success('Книга обновлена', `"${bookTitle}" успешно обновлена`);
            if (this.bookForm.value.status === ReadingStatus.WANT_TO_READ) {
              this.router.navigate(['/wishlist']);
            } else {
              this.router.navigate(['/books']);
            }
          },
          error: (error) => {
            console.error('Ошибка сохранения:', error);
            this.loading$.next(false);
            this.toastService.error('Ошибка обновления', `Не удалось обновить книгу "${bookTitle}"`);
          }
        });
      } else {
        this.bookService.addBook(formValue).subscribe({
          next: () => {
            this.loading$.next(false);
            localStorage.removeItem('book_draft');
            this.toastService.success('Книга добавлена', `"${bookTitle}" успешно добавлена`);
            if (this.bookForm.value.status === ReadingStatus.WANT_TO_READ) {
              this.router.navigate(['/wishlist']);
            } else {
              this.router.navigate(['/books']);
            }
          },
          error: (error) => {
            console.error('Ошибка сохранения:', error);
            this.loading$.next(false);
            this.toastService.error('Ошибка добавления', `Не удалось добавить книгу "${bookTitle}"`);
          },
        });
      }
    });
  }

  private markAllTouched(): void {
    Object.keys(this.bookForm.controls).forEach(key => {
      const control = this.bookForm.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    if (this.bookForm.dirty) {
      if (confirm('У вас есть несохраненные изменения. Выйти без сохранения?')) {
        this.router.navigate(['/books']);
      }
    } else {
      this.router.navigate(['/books']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loading$.complete();
  }
}