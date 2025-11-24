import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Neuro-Dive title', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/NEURO-DIVE/i);
  expect(titleElements.length).toBeGreaterThan(0);
});
