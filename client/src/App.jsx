
import Loader from "./components/Loader";
import { useLoading } from "./contexts/LoaderContext";
import Home from "./pages/Home/Home";
import AppRouter from "./routes/AppRouter";

function App() {
  const {loading} = useLoading();
  return (
    <div className="app-layout flex">
      <div className="flex-1">
        <AppRouter />
        {loading && <Loader />}
      </div>
    </div>
  );
}

export default App;
