import React, { useEffect } from "react";
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

const ShippingInformationPage = ({
  preCarriageBy,
  setPreCarriageBy,
  placeOfReceipt,
  setPlaceOfReceipt,
  placesOfReceipt,
  vesselFlightNo,
  setVesselFlightNo,
  portOfLoading,
  setPortOfLoading,
  portsOfLoading,
  portOfDischarge,
  setPortOfDischarge,
  portsOfDischarge,
  finalDestination,
  setFinalDestination,
  finalDestinations,
  countryOfOrigin,
  setCountryOfOrigin,
  originDetails,
  setOriginDetails,
  countryOfFinalDestination,
  setCountryOfFinalDestination,
  countriesOfFinalDestination,
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
 
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* First row */}
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
            <Label htmlFor="placeOfReceipt">Place of Receipt</Label>
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
                {finalDestinations.map((dest) => (
                  <SelectItem key={dest} value={dest}>
                    {dest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="countryOfOrigin">Country of Origin</Label>
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
            <Label htmlFor="countryOfFinalDestination">
              Country of Final Destination
            </Label>
            <Select
              value={countryOfFinalDestination}
              onValueChange={(value) => setCountryOfFinalDestination(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
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

        {/* Terms and payment */}
        <div className="grid grid-cols-1 gap-4">
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
            <Label htmlFor="payment" className="uppercase text-xs">
              Payment :
            </Label>
            <div className="flex items-start gap-2">
              <Textarea
                id="payment"
                className="mt-1 h-24"
                placeholder="Enter Payment Details"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="currencyRate">Currency Rate</Label>
              <Input
                id="currencyRate"
                value={currencyRate}
                onChange={(e) => setCurrencyRate(e.target.value)}
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