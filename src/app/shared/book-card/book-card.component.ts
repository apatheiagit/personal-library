import { Component, ChangeDetectionStrategy, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Book } from '../../core/models/book.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTooltipModule  ],
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCardComponent implements OnInit{
    public readonly book = input.required<Book>();
    public readonly isReaded = input.required<boolean>();
    public readonly deleteBook = output<void>();
    public readonly moveToWishlist = output<void>();
    public readonly moveToRead = output<void>();
    public readonly maxLength = 200;
    public isExpanded = false;
    public text = '';

    ngOnInit() {
        this.text = this.book().personalReview || '';
    }

    getStarArray(rating?: number): number[] {
        return rating ? Array(rating).fill(0) : [];
    }

    get isTruncated(): boolean {
        return this.text.length > this.maxLength;
    }

    get displayText(): string {
        if (!this.isTruncated || this.isExpanded) {
        return this.escapeHtml(this.text);
        }
        const truncated = this.text.slice(0, this.maxLength);
        return this.escapeHtml(truncated);
    }

    toggleExpand(): void {
        this.isExpanded = !this.isExpanded;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

}