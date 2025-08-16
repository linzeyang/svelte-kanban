# Svelte-Kanban: An AI-native Kanban in LLM-era

A modern kanban application that combines traditional task management with AI-powered features to streamline your workflow. Transform natural language requirements into structured tasks and enhance user stories with intelligent optimization.

## ✨ Features

### 🤖 AI-Powered Task Management

- **Smart Requirement Breakdown**: Describe your requirements in plain English and watch as AI automatically creates structured, actionable tasks
- **Intelligent Story Optimization**: Enhance your user stories with AI-generated improvements and suggestions
- **Flexible AI Integration**: Works with OpenAI, or any OpenAI-compatible API

### 📋 Intuitive Kanban Interface

- **Four-Column Layout**: Organize tasks across "To Do", "In Progress", "Testing", and "Done" columns
- **Drag & Drop**: Seamlessly move tasks between columns with smooth animations
- **Real-time Updates**: Changes are automatically saved to your browser's localStorage

### 🎨 Modern User Experience

- **Dark Theme**: Easy on the eyes with a sleek, futuristic appearance with neon gradients
- **Smooth Animations**: Polished transitions and visual feedback for all interactions
- **Responsive Design**: Works beautifully on various browser window sizes
- **Performance Optimized**: Fast loading and responsive interactions (sub-300ms drag operations)

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- npm (comes with Node.js)
- bun
- An OpenAI API key (or a key from an OpenAI-compatible API service)

### Installation & Setup

1. **Clone and install dependencies:**

   ```bash
   # Install dependencies
   bun install
   ```

2. **Configure your AI service:**

   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```

   Edit the `.env` file with your API credentials:

   ```env
   OPENAI_API_KEY=your_api_key_here
   OPENAI_BASE_URL=https://api.openai.com/v1  # Optional: change it for your custom API provider
   OPENAI_MODEL=gpt-5  # Optional: change it for your custom API provider
   ```

3. **Start the application:**

   ```bash
   # Start dev server
   bun run dev
   ```

4. **Access the application:**
   - Open your browser to `http://localhost:5173`

## 🎯 How to Use

1. **Add Requirements**: Click "Add Requirement" and describe what you need in natural language
2. **AI Breakdown**: Watch as AI automatically creates structured tasks from your description
3. **Manage Tasks**: Drag tasks between columns to track progress
4. **Optimize Stories**: Click on any task to enhance it with AI-powered suggestions
5. **Track Progress**: Your work is automatically saved

## 🛠 Tech Stack

- **Framework**: Svelte 5 / SvelteKit 2
- **Style**: TailwindCSS 4
- **Build**: Vite 7
- **Linting / Formatting**: ESlint / Prettier
- **Testing**: Vitest (unit and component), Playwright (E2E tests)
- **AI Integration**: OpenAI Javascript SDK (supports OpenAI-compatible services)

## 🔧 Configuration

### Environment Variables

| Variable          | Description                                           | Required | Default                     |
| ----------------- | ----------------------------------------------------- | -------- | --------------------------- |
| `OPENAI_API_KEY`  | Your OpenAI API key or a key from custom API provider | Yes      | -                           |
| `OPENAI_BASE_URL` | Custom API endpoint (for OpenRouter, etc.)            | No       | `https://api.openai.com/v1` |
| `OPENAI_MODEL`    | Custom model name/id (for OpenRouter, etc.)           | No       | `gpt-5`                     |

## 🧪 Development & Testing

### Lint / Format

```bash
# Linting:
bun run lint

# Formatting:
bun run format
```

### Running Tests

The project includes comprehensive test coverage:

```bash
# Run all tests
bun run test

# unit / component tests
bun run test:unit

# End-to-end tests
bun run test:e2e
```

### Development Commands

```bash
# development server with auto-reload
bun run dev

# Build for production
bun run build
```

### Deployment

This project has Svelte's Netlify adapter installed which makes it effortless to deploy the build to Netlify.

## 📄 License

This project is open source and available under the MIT License.
