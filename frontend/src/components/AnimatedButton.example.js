/**
 * AnimatedButton Usage Examples
 * 
 * This file demonstrates how to use the AnimatedButton component
 * with different configurations for navigation and loading states.
 */

import React from "react";
import AnimatedButton from "./AnimatedButton";

// Example 1: Basic navigation
function BasicExample() {
  return (
    <AnimatedButton to="/dashboard">
      Go to Dashboard
    </AnimatedButton>
  );
}

// Example 2: Custom delay before navigation
function CustomDelayExample() {
  return (
    <AnimatedButton to="/profile" delay={1000}>
      View Profile (1s delay)
    </AnimatedButton>
  );
}

// Example 3: With custom onClick handler
function WithOnClickExample() {
  const handleClick = async () => {
    // Perform any async operation before navigation
    await fetch('/api/save-data');
    console.log('Data saved!');
  };

  return (
    <AnimatedButton 
      to="/success" 
      onClick={handleClick}
      delay={800}
    >
      Save and Continue
    </AnimatedButton>
  );
}

// Example 4: Disabled state
function DisabledExample() {
  return (
    <AnimatedButton to="/page" disabled>
      Disabled Button
    </AnimatedButton>
  );
}

// Example 5: With additional CSS classes
function StyledExample() {
  return (
    <AnimatedButton 
      to="/events" 
      className="my-custom-class"
    >
      View Events
    </AnimatedButton>
  );
}

// Example 6: Multiple buttons with different destinations
function MultipleButtonsExample() {
  return (
    <div className="flex gap-4">
      <AnimatedButton to="/login">
        Login
      </AnimatedButton>
      <AnimatedButton to="/register">
        Register
      </AnimatedButton>
      <AnimatedButton to="/about">
        About Us
      </AnimatedButton>
    </div>
  );
}

export {
  BasicExample,
  CustomDelayExample,
  WithOnClickExample,
  DisabledExample,
  StyledExample,
  MultipleButtonsExample
};

