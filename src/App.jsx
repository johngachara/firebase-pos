import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Spinner, Flex } from "@chakra-ui/react";

// Lazy load components
const Signin = lazy(() => import("./components/Signin.jsx"));
const AddLcd = lazy(() => import("./components/AddLcd.jsx"));
const ItemList = lazy(() => import("./components/ItemList.jsx"));
const UpdateLcd = lazy(() => import("./components/UpdateLcd.jsx"));
const AddAccessory = lazy(() => import("./components/AddAccessory.jsx"));
const Sell = lazy(() => import("./components/Sell.jsx"));
const Accessories = lazy(() => import("./components/Accessories.jsx"));
const UpdateAccessories = lazy(() => import("./components/UpdateAccessories.jsx"));
const SellAccessory = lazy(() => import("./components/SellAccessory.jsx"));
const Saved = lazy(() => import("./components/Saved.jsx"));
const Dashboard = lazy(() => import("./components/Dashboard.jsx"));
const DetailedDataView = lazy(() => import("./components/DetailedDataView.jsx"));
const LowStock = lazy(() => import("./components/LowStock.jsx"));

function App() {
  return (
      <Router basename='/'>
        <Suspense
            fallback={
              <Flex
                  align="center"
                  justify="center"
                  position="fixed"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  bg="rgba(0, 0, 0, 0.4)"
                  zIndex="9999"
              >
                <Spinner size="xl" color="blue.500" />
              </Flex>
            }
        >
          <Routes>
            <Route path="/Login" element={<Signin />} />
            <Route path="/AddLcd" element={<AddLcd />} />
            <Route path="/" element={<ItemList />} />
            <Route path="/UpdateLcd/:id" element={<UpdateLcd />} />
            <Route path="/SellLcd/:id" element={<Sell />} />
            <Route path="/AddAccessory" element={<AddAccessory />} />
            <Route path="/Accessories" element={<Accessories />} />
            <Route path="/UpdateAccessory/:id" element={<UpdateAccessories />} />
            <Route path="/SellAccessory/:id" element={<SellAccessory />} />
            <Route path="/Transactions" element={<Saved />} />
            <Route path="/Admin" element={<Dashboard />} />
            <Route path="/detailed" element={<DetailedDataView />} />
            <Route path="/LowStock" element={<LowStock />} />
          </Routes>
        </Suspense>
      </Router>
  );
}

export default App;
