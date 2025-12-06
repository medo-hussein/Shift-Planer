import Hero from "../components/Home/Hero";
import Services from "../components/Home/Services";
import ChooseUs from "../components/Home/ChooseUs";
import Branding from "../components/Home/Branding";
import PricingSection from "../components/Home/PricingSection";
import Footer from "../components/Home/Footer";
import HomeNav from "../components/Home/HomeNav";

const Home = () => {
  return (
    <div>
      <HomeNav />
      <Hero />
      <Services />
      <ChooseUs />
      <PricingSection />
      <Branding />
      <Footer />
    </div>
  );
};

export default Home;
