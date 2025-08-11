import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Controller, useForm as rhf, UseFormReturn,useFormContext } from "react-hook-form";

const ShippingInformationPage = ({
  preCarriageBy,
  setPreCarriageBy,
  
  placesOfReceipt,
  setPlacesOfReceipt,
  vesselFlightNo,
  setVesselFlightNo,
  
  setPortOfLoading,
  setPortsOfLoading,
  portsOfLoading,
 
  setPortOfDischarge,
  portsOfDischarge,
  setPortsOfDischarge,
  
  setFinalDestinations,
  finalDestinations,
  countryOfOrigin,
  setCountryOfOrigin,
  originDetails,
  setOriginDetails,
  
  countriesOfFinalDestination,
  setCountriesOfFinalDestination,
  
  paymentTerms,
  
  shippingMethods,
  
  currencies,
  
  form,
}) => {
  const { formData, setInvoiceData } = useForm();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext({shouldFocusError: false,});
  const shippingForm = watch("invoice.shipping");
  const [paymentField, setPaymentField] = useState("");
  async function getShipping() {
    let res = await api.get("/all-dropdowns");
    if (res.status !== 200) {
      return "error";
    }
    return res.data.data;
  }
  // useEffect(() => {
    
      
  //     setValue("invoice.shipping.currency_rate", "88.45");
    
  // }, []);

  // useEffect(() => {
  //   const subscribe = watch((value) => {
  //     console.log(value);
  //   });
  //   return () => subscribe.unsubscribe();
  // }, [watch]);

  useEffect(() => {
    (async () => {
      try {
        const shipping_res = await getShipping();

        setPlacesOfReceipt(shipping_res.place_of_receipt);
        setPortsOfLoading(shipping_res.port_of_loading);
        setPortsOfDischarge(shipping_res.port_of_discharge);
        setFinalDestinations(shipping_res.final_destination);
        setCountriesOfFinalDestination(shipping_res.final_destination);
      } catch (error) {
        // Failed to fetch shipping - handled silently
        console.log(error);
      }
    })();
  }, []);


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
              value={shippingForm?.pre_carriage_by || preCarriageBy}
              {...register("invoice.shipping.pre_carriage_by")}
              onChange={(e) => setPreCarriageBy(e.target.value)}
              placeholder="Enter pre-carriage method"
            />
            {/* {errors?.shipping?.pre_carriage_by && (
              <p className="text-red-500 text-sm">
                {errors?.shipping.pre_carriage_by.message}
              </p>
            )} */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeOfReceipt">
              Place of Receipt by Pre-Carrier
            </Label>

            <Controller
              name="invoice.shipping.place_of_receipt" // this must match your form field name
              control={control}
              rules={{ required: "place of receipt is required" }} // optional: validation rule
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
            {errors?.invoice?.shipping?.place_of_receipt && (
              <p className="text-red-500 text-sm">
                {errors?.invoice?.shipping.place_of_receipt.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vesselFlightNo">Vessel/Flight No.</Label>
            <Input
              id="vesselFlightNo"
              value={shippingForm?.vessel_flight_no || vesselFlightNo}
              {...register("invoice.shipping.vessel_flight_no")}
              onChange={(e) => setVesselFlightNo(e.target.value)}
              placeholder="Enter vessel/flight number"
            />
            {/* {errors?.shipping?.vessel_flight_no && (
              <p className="text-red-500 text-sm">
                {errors?.shipping.vessel_flight_no.message}
              </p>
            )} */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="portOfLoading">Port of Loading</Label>
            <Controller
              name="invoice.shipping.port_of_loading" // this must match your form field name
              control={control}
              rules={{ required: "port of loading required" }} // optional: validation rule
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value); // update RHF value
                    setPortOfLoading(value); // optional: local state

                    // custom logic: update Terms of Delivery if needed
                    if (paymentTerms === "FOB") {
                      setValue("invoice.shipping.terms_of_delivery",`FOB AT ${value}`);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select port of loading" />
                  </SelectTrigger>
                  <SelectContent>
                    {portsOfLoading.map((place) => (
                      <SelectItem key={place} value={place}>
                        {place}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors?.invoice?.shipping?.port_of_loading && (
              <p className="text-red-500 text-sm">
                {errors?.invoice?.shipping.port_of_loading.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="portOfDischarge">Port of Discharge</Label>
            <Controller
              name="invoice.shipping.port_of_discharge" // this must match your form field name
              control={control}
              rules={{ required: true }} // optional: validation rule
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value); // update RHF value
                    setPortOfDischarge(value); // optional: local state

                    // Update Terms of Delivery if payment terms are CIF or CNF
                    if (paymentTerms === "CIF") {
                      setValue("invoice.shipping.terms_of_delivery",`CIF AT ${value}`);
                    } else if (paymentTerms === "CNF") {
                      setValue("invoice.shipping.terms_of_delivery",`CNF AT ${value}`);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select port of discharge" />
                  </SelectTrigger>
                  <SelectContent>
                    {portsOfDischarge.map((place) => (
                      <SelectItem key={place} value={place}>
                        {place}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors?.invoice?.shipping?.port_of_discharge && (
              <p className="text-red-500 text-sm">
                {errors?.invoice?.shipping.port_of_discharge.message}
              </p>
            )}
            
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalDestination">Final Destination</Label>
            <Controller
              name="invoice.shipping.final_destination" // this must match your form field name
              control={control}
              rules={{ required: true }} // optional: validation rule
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select place of final Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {finalDestinations.map((place) => (
                      <SelectItem key={place} value={place}>
                        {place}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors?.invoice?.shipping?.final_destination && (
              <p className="text-red-500 text-sm">
                {errors?.invoice?.shipping.final_destination.message}
              </p>
            )}
          </div>
        </div>

        {/* Second row of fields - green highlighted in the image */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="countryOfOrigin">Country of Origin of Goods</Label>
            <Input
                id="countryOfOrigin"
                value={countryOfOrigin}
                defaultValue={countryOfOrigin}
                {...register("invoice.shipping.country_of_origin", {
                  required: true,
                  value: countryOfOrigin // Set default value
                })}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                placeholder="Enter country of origin"
                readOnly
              />

            {errors?.invoice?.shipping?.country_of_origin && (
              <p className="text-red-500 text-sm">
                {errors?.invoice?.shipping.country_of_origin.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="originDetails">Origin Details</Label>
            <Input
              id="originDetails"
              value={originDetails}
              {...register("invoice.shipping.origin_details", {
                required: true,
                value: originDetails // Set default value
              })}
              onChange={(e) => setOriginDetails(e.target.value)}
              placeholder="Enter origin details"
            />
            {errors?.invoice?.shipping?.origin_details && (
              <p className="text-red-500 text-sm">
                {errors?.invoice?.shipping.origin_details.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="countryOfFinalDestination">
              Country of Final Destination
            </Label>
            <Controller
              name="invoice.shipping.country_of_final_destination" // this must match your form field name
              control={control}
              rules={{ required: true }} // optional: validation rule
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select place of country final Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {countriesOfFinalDestination.map((place) => (
                      <SelectItem key={place} value={place}>
                        {place}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors?.invoice?.shipping?.country_of_final_destination && (
              <p className="text-red-500 text-sm">
                {errors?.invoice?.shipping.country_of_final_destination.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="termsOfDelivery">Terms of Delivery</Label>
            <Input
              id="termsOfDelivery"
              value={shippingForm?.terms_of_delivery || ""}
              {...register("invoice.shipping.terms_of_delivery", {
                required: "Terms of Delivery are required",
              })}
              
              
              className="bg-gray-50"
              placeholder="Terms of Delivery"
            />
            {errors?.invoice?.shipping?.terms_of_delivery && (
              <p className="text-red-500 text-sm">
                {errors?.invoice?.shipping.terms_of_delivery.message}
              </p>
            )}
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
                value={shippingForm?.payment || paymentField}
                {...register("invoice.shipping.payment", {
                  required: "Payment details are required",
                })}
                // onChange={(e) => setPaymentField(() => e.target.value)}
              />
              {errors?.invoice?.shipping?.payment && (
                <p className="text-red-500 text-sm">
                  {errors?.invoice?.shipping.payment.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid flex-row grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shippingMethod">Shipping Method</Label>
              <Controller
                name="invoice.shipping.shipping_method" // this must match your form field name
                control={control}
                rules={{ required: true }} // optional: validation rule
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select place of shipping method" />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingMethods.map((place) => (
                        <SelectItem key={place} value={place}>
                          {place}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors?.invoice?.shipping?.shipping_method && (
                <p className="text-red-500 text-sm">
                  {errors?.invoice?.shipping.shipping_method.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="selectedCurrency">Currancy</Label>
              <Controller
                name="invoice.currency_type" // this must match your form field name
                control={control}
                rules={{ required: "currency required" }} // optional: validation rule
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currancy" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((place) => (
                        <SelectItem key={place} value={place}>
                          {place}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors?.invoice?.currency_type && (
                <p className="text-red-500 text-sm">
                  {errors?.invoice?.currency_type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencyRate">
                Current Rate
              </Label>
              <Input
                id="currencyRate"
                
                {...register("invoice.currency_rate", {
                  required: "Currency rate is required",
                  valueAsNumber: true,
                  min: {
                    value: 0.01,
                    message: "Currency rate must be greater than 0",
                  },
                  pattern: {
                    value: /^\d*\.?\d{0,2}$/,
                    message: "Please enter a valid number with up to 2 decimal places",
                  },
                })}
                // onChange={(e) => setCurrencyRate(e.target.value)}
                placeholder="Enter currency rate"
                type="text"
                step="0.01"
                // only non negative numbers with up to 2 decimal places
                onInput={(e) => {
                    // Allow only numbers and one decimal point with up to 2 decimal places
                    let value = e.target.value;
                    
                    // Remove any non-digit and non-decimal characters
                    value = value.replace(/[^0-9.]/g, '');
                    
                    // Ensure only one decimal point
                    const parts = value.split('.');
                    if (parts.length > 2) {
                      value = parts[0] + '.' + parts.slice(1).join('');
                    }
                    
                    // Limit to 2 decimal places
                    if (parts[1] && parts[1].length > 2) {
                      value = parts[0] + '.' + parts[1].substring(0, 2);
                    }
                    
                    // Prevent starting with decimal point (optional)
                    if (value.startsWith('.')) {
                      value = '0' + value;
                    }
                    
                    e.target.value = value;
                  }}
                
              />
              {errors?.invoice?.currency_rate && (
                <p className="text-red-500 text-sm">
                  {errors?.invoice?.currency_rate.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShippingInformationPage;
