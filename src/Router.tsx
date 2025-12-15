import { BrowserRouter, Route, Routes } from "react-router-dom";
import Editor from "./pages/Editor";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { Toaster } from "react-hot-toast";

export default function Router() {
  return (
    <BrowserRouter>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Editor />} />
        </Routes>
      </main>
      <Toaster position="bottom-right" />
      <Footer />
    </BrowserRouter>
  );
}
