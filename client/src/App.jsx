import Loader from "./components/Loader";
import { useLoading } from "./contexts/LoaderContext";
import AppRouter from "./routes/AppRouter";
import { useToast } from "./hooks/useToast";
import "./utils/I18n";
import { useTranslation } from "react-i18next";

function App() {
  const { loading } = useLoading();
  const { ToastContainer } = useToast();
  const { i18n } = useTranslation();

  return (
    <div className="app-layout flex" dir={i18n.dir()}>
      <div className="flex-1">
        <AppRouter />
        {loading && <Loader />}
        <ToastContainer />
      </div>
    </div>
  );
}

export default App;