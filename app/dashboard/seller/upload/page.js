import ProductUploadForm from '../../../components/ProductUploadForm';
import DualNavbarSell from '../../../components/DualNavbarSell';

// Viewport export for themeColor
export const viewport = {
  themeColor: '#ffffff',
};

// Metadata export
export const metadata = {
  metadataBase: new URL('http://localhost:3001'),
  title: 'Upload Product - Eraiiz',
  description: 'Upload your product to Eraiiz marketplace',
};

export default function UploadProductPage() {
  return (
    <div className="min-h-screen bg-white">
      <DualNavbarSell />
      <main>
        <ProductUploadForm />
      </main>
    </div>
  );
}