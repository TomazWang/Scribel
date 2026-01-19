import { JotPanel } from "./components/JotPanel";

function App() {
  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-6 py-4">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Scribel
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Jot first, organize later
        </p>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        <JotPanel />
      </main>
    </div>
  );
}

export default App;
