import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Book } from '../../core/models/book.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, RouterModule ],
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCardComponent {
    public readonly book = input.required<Book>();
    public readonly isReaded = input.required<boolean>();
    public readonly deleteBook = output<void>();
    public readonly moveToWishlist = output<void>();
    public readonly moveToRead = output<void>();

    getStarArray(rating?: number): number[] {
        return rating ? Array(rating).fill(0) : [];
    }

}