import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { useForm } from "@/context/FormContext";

const ShippingInformationPage = ({
  preCarriageBy,
  setPreCarriageBy,
  placeOfReceipt,
  setPlaceOfReceipt,
  placesOfReceipt,
  setPlacesOfReceipt,
  vesselFlightNo,
  setVesselFlightNo,
  portOfLoading,
  setPortOfLoading,
  setPortsOfLoading,
  portsOfLoading,
  portOfDischarge,
  setPortOfDischarge,
  portsOfDischarge,
  setPortsOfDischarge,
  finalDestination,
  setFinalDestination,
  setFinalDestinations,
  finalDestinations,
  countryOfOrigin,
  setCountryOfOrigin,
  originDetails,
  setOriginDetails,
  countryOfFinalDestination,
  setCountryOfFinalDestination,
  countriesOfFinalDestination,
  setCountriesOfFinalDestination,
  termsOfDelivery,
  setTermsOfDelivery,
  paymentTerms,
  shippingMethod,
  setShippingMethod,
  shippingMethods,
  selectedCurrency,
  setSelectedCurrency,
  currencies,
  currencyRate,
  setCurrencyRate,
}) => {
  const {formData, setInvoiceData} = useForm();
  const [paymentField, setPaymentField] = useState("");
  async function getShipping(){

    let res = await api.get("/all-dropdowns")
    if(res.status !== 200){
      return "error"
    }
    return res.data.data
  }
  useEffect(()=>{
    (async ()=>{

      try{
        const shipping_res = await getShipping();
      
        setPlacesOfReceipt(shipping_res.place_of_receipt);
        setPortsOfLoading(shipping_res.port_of_loading);
        setPortsOfDischarge(shipping_res.port_of_discharge);
        setFinalDestinations(shipping_res.final_destination);
        setCountriesOfFinalDestination(shipping_res.final_destination);
      }
      catch(error){
        console.error("Failed to fetch shipping:", error);
      }
    })()
    },[])
    
    useEffect(()=>{
      setInvoiceData({
        ...formData.invoice,
        currency_type: selectedCurrency,
        currency_rate: currencyRate,
        shipping: {
          pre_carriage_by: preCarriageBy,
          shipping_method: shippingMethod,
          place_of_receipt: placeOfReceipt,
          port_of_loading: portOfLoading,
          port_of_discharge: portOfDischarge,
          final_destination: finalDestination,
          country_of_origin: countryOfOrigin,
          origin_details: originDetails,
          country_of_final_destination: countryOfFinalDestination,
          terms_of_delivery: termsOfDelivery,
          payment: paymentField,
          vessel_flight_no: vesselFlightNo,
          
          
        }
      })
    },[placeOfReceipt, portOfLoading, portOfDischarge, finalDestination, countryOfOrigin, originDetails, countryOfFinalDestination, termsOfDelivery, paymentTerms, shippingMethod, selectedCurrency, currencyRate])
  return (
    <Card>
    <CardHeader>
      <CardTitle>Shipping Information</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* First row of fields - yellow highlighted in the image */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preCarriageBy">Pre-Carriage By</Label>
          <Input
            id="preCarriageBy"
            value={preCarriageBy}
            onChange={(e) => setPreCarriageBy(e.target.value)}
            placeholder="Enter pre-carriage method"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="placeOfReceipt">Place of Receipt by Pre-Carrier</Label>
          <Select
            value={placeOfReceipt}
            onValueChange={(value) => setPlaceOfReceipt(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select place of receipt" />
            </SelectTrigger>
            <SelectContent>
              {placesOfReceipt.map((place) => (
                <SelectItem key={place} value={place}>
                  {place}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

            <div className="space-y-2">
              <Label htmlFor="vesselFlightNo">Vessel/Flight No.</Label>
              <Input
                id="vesselFlightNo"
                value={vesselFlightNo}
                onChange={(e) => setVesselFlightNo(e.target.value)}
                placeholder="Enter vessel/flight number"
              />
            </div>

        <div className="space-y-2">
          <Label htmlFor="portOfLoading">Port of Loading</Label>
          <Select
            value={portOfLoading}
            onValueChange={(value) => {
              setPortOfLoading(value);
              
              // Update Terms of Delivery if payment terms are FOB
              if (paymentTerms === "FOB") {
                setTermsOfDelivery(`FOB AT ${value}`);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select port of loading" />
            </SelectTrigger>
            <SelectContent>
              {portsOfLoading.map((port) => (
                <SelectItem key={port} value={port}>
                  {port}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="portOfDischarge">Port of Discharge</Label>
          <Select
            value={portOfDischarge}
            onValueChange={(value) => {
              setPortOfDischarge(value);
              
              // Update Terms of Delivery if payment terms are CIF or CNF
              if (paymentTerms === "CIF") {
                setTermsOfDelivery(`CIF AT ${value}`);
              } else if (paymentTerms === "CNF") {
                setTermsOfDelivery(`CNF AT ${value}`);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select port of discharge" />
            </SelectTrigger>
            <SelectContent>
              {portsOfDischarge.map((port) => (
                <SelectItem key={port} value={port}>
                  {port}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="finalDestination">Final Destination</Label>
          <Select
            value={finalDestination}
            onValueChange={(value) => setFinalDestination(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select final destination" />
            </SelectTrigger>
            <SelectContent>
              {finalDestinations.map((destination) => (
                <SelectItem key={destination} value={destination}>
                  {destination}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Second row of fields - green highlighted in the image */}
      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="countryOfOrigin">Country of Origin of Goods</Label>
          <Input
            id="countryOfOrigin"
            value={countryOfOrigin}
            onChange={(e) => setCountryOfOrigin(e.target.value)}
            placeholder="Enter country of origin"
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="originDetails">Origin Details</Label>
          <Input
            id="originDetails"
            value={originDetails}
            onChange={(e) => setOriginDetails(e.target.value)}
            placeholder="Enter origin details"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="countryOfFinalDestination">Country of Final Destination</Label>
          <Select
            value={countryOfFinalDestination}
            onValueChange={(value) => setCountryOfFinalDestination(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country of final destination" />
            </SelectTrigger>
            <SelectContent>
              {countriesOfFinalDestination.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="termsOfDelivery">Terms of Delivery</Label>
          <Input
            id="termsOfDelivery"
            value={termsOfDelivery}
            readOnly
            className="bg-gray-50"
            placeholder="Terms of Delivery"
          />
        </div>

        <div>
        <Label htmlFor="payment" className="uppercase text-xs">Payment :</Label>
        <div className="flex items-start gap-2">
          <Textarea
            id="payment"
            className="mt-1 h-24"
            placeholder="Enter Payment Details"
            value={paymentField}
            onChange={(e) => setPaymentField(e.target.value)}
          />
        </div>
      </div>

       
        
        <div className="grid flex-row grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shippingMethod">Shipping Method</Label>
          <Select
            value={shippingMethod}
            onValueChange={(value) => setShippingMethod(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select shipping method" />
            </SelectTrigger>
            <SelectContent>
              {shippingMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="selectedCurrency">Currency</Label>
          <Select
            value={selectedCurrency}
            onValueChange={(value) => setSelectedCurrency(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currencyRate">Current {selectedCurrency} Rate</Label>
          <Input
            id="currencyRate"
            value={currencyRate}
            onChange={(e) => setCurrencyRate(parseInt(e.target.value))}
            placeholder="Enter currency rate"
            type="number"
            step="0.01"
          />
        </div>
      </div>
      </div>
    </CardContent>
  </Card>
  );
};

export default ShippingInformationPage;