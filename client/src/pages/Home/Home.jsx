import Hero from "./Hero";
import Services from "./Services";
import ChooseUs from "./ChooseUs";
import Branding from "./Branding";
import Footer from "./Footer";
import HomeNav from "./HomeNav";

const Home = () => {
  return (
    <div>
      <HomeNav />    
      <Hero />
      <Services />
      <ChooseUs />
      <Branding /> 
      <Footer />
    </div>
  );
};

export default Home;
