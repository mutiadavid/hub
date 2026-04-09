import Footer from "../components/footer";
import Navbar from "../components/navbar"; 
import DashboardCards from "../components/DashboardCards"; // import the new DashboardCards component
import { useState } from "react";

const Home = () => {
  const [dclList] = useState([
    {
      id: "DCL-001",
      customer: "ABC Manufacturers Ltd",
      rm: "Sarah Johnson",
      submitted: "2024-11-06 10:14",
      status: "Pending Review",
    },
    {
      id: "DCL-002",
      customer: "Prime Logistics",
      rm: "Michael Chen",
      submitted: "2024-11-07 09:50",
      status: "Pending Review",
    },
  ]);

  return (
    <div>
      <Navbar />

      <section className="px-6 py-6 rounded-xl shadow-sm animate-fadeIn bg-[#F4F7FC]">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Credit Officer Dashboard
        </h2>

        <DashboardCards dclList={dclList} />
      </section>

      <Footer />
    </div>
  );
};

export default Home;
