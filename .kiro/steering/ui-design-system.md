# UI Design System and Guidelines

## Design Theme

- **Primary Theme**: Dark, futuristic interface
- **Color Palette**: Neon gradients with dark backgrounds (OKLCH color space)
- **Typography**: Clean, modern fonts with good readability
- **Animations**: Smooth transitions under 300ms
- **Responsive**: Container queries preferred over viewport breakpoints

## Key Design Tokens

### Color Palette (OKLCH)
- **Neon Blue**: `oklch(0.7 0.25 240)` - Primary accent
- **Neon Purple**: `oklch(0.65 0.3 300)` - Secondary accent
- **Neon Green**: `oklch(0.8 0.25 120)` - Success states
- **Background Primary**: `oklch(0.05 0.01 240)` - Main background
- **Text Primary**: `oklch(0.98 0 0)` - High contrast text

### Typography
- **Display Font**: Inter, system-ui, sans-serif
- **Monospace Font**: JetBrains Mono, Consolas, monospace

### Animation Easing
- **Fluid**: `cubic-bezier(0.3, 0, 0, 1)` - Smooth transitions
- **Snappy**: `cubic-bezier(0.2, 0, 0, 1)` - Quick interactions
- **Bounce**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - Playful effects

## Component Design Patterns

### Kanban Board Layout
- Four columns: "To Do", "In Progress", "Testing", "Done"
- Neon borders around columns with status-specific colors
- Gradient backgrounds for visual hierarchy
- Smooth hover effects and transitions (< 300ms)

### Key UI Components
- **Task Cards**: Gradient backgrounds with neon borders, 3D hover effects
- **Modals**: Glass effect with backdrop blur and enter animations
- **Form Elements**: Dark inputs with neon focus states
- **Buttons**: Gradient backgrounds with hover scaling effects
- **AI Indicators**: Pulsing animations for AI-generated content

### Modern CSS Features
- **Container Queries**: `@container` for responsive layouts
- **3D Transforms**: `perspective-*` and `rotate-x-*` utilities
- **Text Shadows**: `text-shadow-*` for better readability
- **Starting Animations**: `starting:*` variants for enter effects
- **Color Mixing**: `color-mix()` for dynamic color variations
- **Field Sizing**: `field-sizing-content` for auto-resizing inputs

## Accessibility Standards

- Maintain WCAG 2.1 AA compliance
- Proper ARIA labels and roles
- Keyboard navigation support
- High contrast ratios for text readability (OKLCH ensures better contrast)
- Screen reader compatibility
- Touch-friendly interactions with appropriate target sizes

## Component Library Structure

```
src/lib/components/
├── ui/
│   ├── Button.svelte
│   ├── Modal.svelte
│   ├── Input.svelte
│   └── Card.svelte
├── kanban/
│   ├── KanbanBoard.svelte
│   ├── KanbanColumn.svelte
│   └── TaskCard.svelte
└── modals/
    ├── AddRequirementModal.svelte
    └── OptimizeStoryModal.svelte
```

## Browser Compatibility

- **Modern browsers**: Safari 16.4+, Chrome 111+, Firefox 128+
- **OKLCH color support**: Full support in modern browsers
- **Container queries**: Native support required
- **3D transforms**: Hardware acceleration recommended
- **Fallbacks**: Automatic for older browsers where possible

> **Note**: For complete TailwindCSS 4 setup, configuration, implementation examples, and migration guide, see `modern-stack-guide.md`
