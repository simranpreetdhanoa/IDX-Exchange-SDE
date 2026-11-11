import { Route, Routes } from 'react-router';
import ListingsPage from './pages/ListingsPage';
import PropertyDetailPage from './pages/PropertyDetailPage';

// Week 8: the address decides which page to show
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ListingsPage />} />
      <Route path="/property/:id" element={<PropertyDetailPage />} />
      <Route path="*" element={<p className="listings-status">Page not found.</p>} />
    </Routes>
  );
}
