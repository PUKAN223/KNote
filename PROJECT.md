# KNote — Product & Design Brief

## Vision

KNote is a premium note-taking application built for iPad users.

The goal is not to create another productivity tool or file manager.

The goal is to create a calm, beautiful digital notebook that feels as natural as writing on paper.

Users should feel like they are opening a premium notebook, not a website.

The application must feel native, tactile, elegant, and distraction-free.

---

# Core Philosophy

Writing comes first.

The interface exists to support writing, not compete with it.

Every screen, animation, interaction, and component should contribute to focus and comfort.

Avoid:

* Dashboard-style layouts
* Corporate SaaS aesthetics
* Complex navigation
* Cluttered interfaces
* Feature overload

Prioritize:

* Simplicity
* Calmness
* Focus
* Comfort
* Delight

---

# Target Platform

Primary:

* iPad
* Apple Pencil
* PWA installed to Home Screen

Secondary:

* Desktop
* Android Tablet

Mobile phones are not the primary design target.

---

# User Experience Goal

When users open KNote, they should immediately feel:

* This is a real application
* This is built for touch
* This is built for writing
* This feels premium
* This feels relaxing

The application should never feel like a website.

---

# Visual Identity

## Design Style

Premium Minimalism

A combination of:

* Premium stationery
* Modern Apple design
* Luxury paper products
* Warm reading spaces

---

## Color Palette

Background

#FAF8F3

Surface

#FFFFFF

Border

#ECE7DD

Primary Accent

#7C6A46

Text

#2D2D2D

Success

#6B8E6E

Danger

#B56A6A

Avoid bright, saturated colors.

---

# Main Concept

## Paper Stack Interface

The application should not use a traditional file explorer.

Instead, notebooks should feel like physical objects placed on a desk.

Opening a notebook should feel like picking up a notebook.

Closing a notebook should feel like putting it back.

The experience should be emotional and tactile.

---

# Home Screen

The home screen should resemble a premium desk.

Large notebook cards.

Generous spacing.

Minimal controls.

No complex sidebar navigation.

No overwhelming menus.

The notebook collection is the hero of the screen.

---

# Writing Experience

Writing is the core product.

The canvas should occupy approximately 85% of the visible interface.

The user should feel like they are writing on paper.

UI should fade into the background.

---

# Canvas

Features:

* Apple Pencil support
* Pressure sensitivity
* Palm rejection
* Smooth strokes
* Infinite scrolling
* Zoom
* Pan
* Undo
* Redo

Canvas performance is more important than decorative features.

---

# Toolbar

Floating toolbar.

Rounded corners.

Glass-like appearance.

Subtle blur.

The toolbar should feel like a premium tool tray.

Tools:

* Pen
* Pencil
* Highlighter
* Eraser
* Lasso
* Undo
* Redo

Toolbar should never dominate the interface.

---

# Motion Design

Animations should feel physical.

Imagine moving paper rather than moving UI.

Animation Principles:

* Soft
* Natural
* Responsive
* Purposeful

Duration:

150ms–250ms

Examples:

* Notebook opening
* Notebook closing
* Tool selection
* Page switching
* Zoom transitions

Avoid flashy effects.

Avoid large bounces.

Avoid excessive motion.

---

# Native App Feeling

Users should forget they are using a web application.

Requirements:

* Fullscreen PWA
* No browser chrome
* Instant navigation
* No page reloads
* Offline support
* Fast startup
* Smooth scrolling
* Touch-first design

Every interaction should feel immediate.

---

# Touch Experience

Minimum touch target:

48px

Comfortable spacing between controls.

Every interaction must be usable with fingers.

No desktop-style controls.

---

# Apple Pencil Experience

Writing should begin instantly.

The application must respect:

* Pressure
* Pencil input
* Palm rejection

The writing experience should feel natural and effortless.

---

# Empty States

Beautiful.

Minimal.

Quiet.

Example:

"Start your first notebook."

Avoid technical language.

Avoid overwhelming users.

---

# Technical Stack

Framework:

* Next.js
* TypeScript

Styling:

* Tailwind CSS
* shadcn/ui

State:

* Zustand

Storage:

* IndexedDB
* Dexie

Canvas:

* HTML Canvas
* Pointer Events

PWA:

* next-pwa

Future:

* Firebase Sync
* Real-time Collaboration
* OCR
* PDF Annotation

---

# Performance Requirements

Target:

* 60 FPS minimum
* Optimized Pencil rendering
* Instant local save
* Offline-first architecture

The application should remain smooth even with large notebooks.

---

# Success Criteria

A user opens KNote on an iPad and immediately feels:

"I want to write here."

The application feels:

* Premium
* Warm
* Focused
* Elegant
* Natural

Most importantly:

It feels like a real app, not a website.
