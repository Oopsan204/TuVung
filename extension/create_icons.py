#!/usr/bin/env python3
"""
Script to create PNG icon files from SVG for the TuVung Chrome extension
"""

import os
from PIL import Image, ImageDraw

def create_icon(size, filename):
    """Create a simple book icon in the specified size"""
    # Create a new image with white background
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions based on size
    margin = size // 8
    book_width = size - 2 * margin
    book_height = int(book_width * 0.8)
    
    # Center the book
    x = margin
    y = (size - book_height) // 2
    
    # Draw book cover (main rectangle)
    cover_color = (74, 144, 226)  # Blue color
    draw.rectangle([x, y, x + book_width, y + book_height], fill=cover_color)
    
    # Draw book spine (left edge)
    spine_width = size // 20
    spine_color = (54, 124, 206)  # Darker blue
    draw.rectangle([x, y, x + spine_width, y + book_height], fill=spine_color)
    
    # Draw pages (white lines on the right edge)
    page_color = (255, 255, 255)
    page_width = size // 30
    page_x = x + book_width - page_width
    draw.rectangle([page_x, y + size//10, page_x + page_width, y + book_height - size//10], fill=page_color)
    
    # Draw title lines (representing text)
    line_color = (255, 255, 255)
    line_height = size // 40
    line_y_start = y + size // 4
    line_spacing = size // 15
    
    # Title line 1
    draw.rectangle([x + size//6, line_y_start, x + book_width - size//6, line_y_start + line_height], fill=line_color)
    
    # Title line 2 (shorter)
    draw.rectangle([x + size//6, line_y_start + line_spacing, x + book_width - size//3, line_y_start + line_spacing + line_height], fill=line_color)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    # Create the icon files
    create_icon(16, 'icon16.png')
    create_icon(48, 'icon48.png')
    create_icon(128, 'icon128.png')
    
    print("All icon files created successfully!")

if __name__ == "__main__":
    main()
