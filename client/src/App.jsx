
import Loader from "./components/Loader";
import { useLoading } from "./contexts/LoaderContext";
import AppRouter from "./routes/AppRouter";
import { useToast } from "./hooks/useToast";

function App() {
  const {loading} = useLoading();
  const { ToastContainer } = useToast();
  
  return (
    <div className="app-layout flex">
      <div className="flex-1">
        <AppRouter />
        {loading && <Loader />}
        <ToastContainer />
      </div>
    </div>
  );
}

export default App;
