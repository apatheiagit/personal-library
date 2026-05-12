import { ChangeDetectionStrategy, Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter, finalize, map, shareReplay, switchMap, take } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { BookService } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';
import { Rating, ReadingStatus } from '../../core/models/book.model';
import { DialogComponent } from '../../shared/dialog/dialog.component';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule,
    MatButtonModule, MatSelectModule, MatInputModule, MatFormFieldModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookFormComponent  {
  public router = inject(Router);
  public bookService = inject(BookService);
  readonly dialog = inject(MatDialog);
  bookForm: FormGroup;
  ReadingStatus = ReadingStatus;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

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
  }

  private loadBookIfEditMode(): void {
    this.bookToEdit$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(book => {
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
    this.bookForm.get('status')?.valueChanges
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(status => {
      this.toggleRatingReviewFields(status);
    });
  }

  private setupAutoSave(): void {
    this.bookForm.valueChanges
    .pipe(
      filter(() => this.bookForm.valid && !!this.bookForm.get('title')?.value && !!this.bookForm.get('author')?.value && !!this.bookForm.get('personalReview')?.value),
      debounceTime(30000),
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe(formValue => {
      localStorage.setItem('book_draft', JSON.stringify(formValue));
      this.toastService.info('Черновик сохранен', 'Все изменения сохранены в черновике');
    });
    
    const draft = localStorage.getItem('book_draft');
    if (draft && !this.route.snapshot.paramMap.get('id')) {
      const draftData = JSON.parse(draft);
      const dialogRef = this.dialog.open(
        DialogComponent, 
        {
          data: {
            title: 'Внимание!',
            message: 'Найден несохраненный черновик. Загрузить?',
          },
        },
      );
      dialogRef.afterClosed().subscribe((x) => {
        if (x)
          this.bookForm.patchValue(draftData);
        dialogRef.close();
      });
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

    this.isEditMode$
      .pipe(
        take(1),
        switchMap(isEdit => {
          if (isEdit) {
            return this.bookId$.pipe(
              take(1),
              switchMap(id => this.bookService.getBookById(id!)),
              switchMap(book => this.bookService.updateBook(book.id, { ...book, ...formValue })),
            );
          } else {
            return this.bookService.addBook(formValue);
          }
        }),
        finalize(() => this.loading$.next(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          localStorage.removeItem('book_draft');
          this.isEditMode$
            .pipe(take(1))
            .subscribe(isEdit => {
              if (isEdit)
                this.toastService.success('Книга обновлена', `"${bookTitle}" успешно обновлена`);
              else
                this.toastService.success('Книга добавлена', `"${bookTitle}" успешно добавлена в библиотеку`);
            });
          
          if (this.bookForm.value.status === ReadingStatus.WANT_TO_READ)
            this.router.navigate(['/wishlist']);
          else
            this.router.navigate(['/books']);
        },
        error: (error) => {
          console.error('Ошибка сохранения:', error);
        },
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
      const dialogRef = this.dialog.open(
        DialogComponent, 
        {
          data: {
            title: 'Внимание!',
            message: 'У вас есть несохраненные изменения. Выйти без сохранения?',
          },
        },
      );
      dialogRef.afterClosed().subscribe((x) => {
        if (x) {
          this.router.navigate(['/books']);
        } else {
          dialogRef.close();
        }
      });
    } else {
      this.router.navigate(['/books']);
    }
  }
}