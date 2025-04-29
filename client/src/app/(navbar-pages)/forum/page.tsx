<<<<<<< HEAD
import React from "react";

export default function page() {
  return <div>Forum</div>;
}
=======
import DiscourseForum from "../../../components/DiscourseForum";
export default function Page() {
  return (
    <main className="max-w-3xl mx-auto p-4 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Community Forums</h1>
      <DiscourseForum />
    </main>
  );
}
>>>>>>> stagging
