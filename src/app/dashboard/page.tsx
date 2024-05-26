"use client";

export default function Page() {
  function output() {
    console.log("Hello, Dashboard Page!");
  }

  return (
    <>
      <h1>Hello, Dashboard Page!</h1>
      <button onClick={output}>Click me</button>
    </>
  );
}
