import React from "react";
import Login from "./Login";

export default function Register() {
  // Render Login component with register mode as initial mode
  return <Login onLogin={() => {}} initialMode="register" />;
}
