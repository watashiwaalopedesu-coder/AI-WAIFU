"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="app-loading">
      <h1>Let’s try that again.</h1>
      <p>Your companion hit an unexpected problem.</p>
      <button className="primary-button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
