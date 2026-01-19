import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [jotInput, setJotInput] = useState("");
  const [greetMsg, setGreetMsg] = useState("");

  async function testGreet() {
    setGreetMsg(await invoke("greet", { name: "Scribel" }));
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Scribel</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Jot first, organize later
          </p>
        </header>

        {/* Jot Input Placeholder */}
        <div className="mb-8">
          <input
            type="text"
            value={jotInput}
            onChange={(e) => setJotInput(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && jotInput.trim()) {
                // Placeholder - will be replaced with JotPanel component (Epic 1, Feature 1.3)
                console.log("Create jot:", jotInput);
                setJotInput("");
              }
            }}
          />
        </div>

        {/* Jot List Placeholder */}
        <div className="space-y-2">
          <div className="text-sm text-neutral-400">No jots yet. Start typing above!</div>
        </div>

        {/* Test connection to Rust backend */}
        <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={testGreet}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Test Tauri Connection
          </button>
          {greetMsg && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              {greetMsg}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
