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
import { Controller, useForm as rhf, UseFormReturn } from "react-hook-form";

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
  } = form;
  const shippingForm = watch("shipping");
  const [paymentField, setPaymentField] = useState("");
  async function getShipping() {
    let res = await api.get("/all-dropdowns");
    if (res.status !== 200) {
      return "error";
    }
    return res.data.data;
  }

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

  // useEffect(()=>{
  //   setInvoiceData({
  //     ...formData.invoice,
  //     currency_type: selectedCurrency,
  //     currency_rate: currencyRate,
  //     shipping: {
  //       pre_carriage_by: preCarriageBy,
  //       shipping_method: shippingMethod,
  //       place_of_receipt: placeOfReceipt,
  //       port_of_loading: portOfLoading,
  //       port_of_discharge: portOfDischarge,
  //       final_destination: finalDestination,
  //       country_of_origin: countryOfOrigin,
  //       origin_details: originDetails,
  //       country_of_final_destination: countryOfFinalDestination,
  //       terms_of_delivery: termsOfDelivery,
  //       payment: paymentField,
  //       vessel_flight_no: vesselFlightNo,

  //     }
  //   })
  // },[placeOfReceipt, portOfLoading, portOfDischarge, finalDestination, countryOfOrigin, originDetails, countryOfFinalDestination, termsOfDelivery, paymentTerms, shippingMethod, selectedCurrency, currencyRate,paymentField])
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
              {...register("shipping.pre_carriage_by", {
                required: "Pre-Carriage By is required",
              })}
              onChange={(e) => setPreCarriageBy(e.target.value)}
              placeholder="Enter pre-carriage method"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeOfReceipt">
              Place of Receipt by Pre-Carrier
            </Label>

            <Controller
              name="shipping.place_of_receipt" // this must match your form field name
              control={control}
              rules={{ required: true }} // optional: validation rule
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="vesselFlightNo">Vessel/Flight No.</Label>
            <Input
              id="vesselFlightNo"
              value={vesselFlightNo}
              {...register("shipping.vessel_flight_no", {
                required: "Vessel/Flight No. is required",
              })}
              onChange={(e) => setVesselFlightNo(e.target.value)}
              placeholder="Enter vessel/flight number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portOfLoading">Port of Loading</Label>
            <Controller
              name="shipping.place_of_loading" // this must match your form field name
              control={control}
              rules={{ required: true }} // optional: validation rule
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value); // update RHF value
                    setPortOfLoading(value); // optional: local state

                    // custom logic: update Terms of Delivery if needed
                    if (paymentTerms === "FOB") {
                      setTermsOfDelivery(`FOB AT ${value}`);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select place of loading" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="portOfDischarge">Port of Discharge</Label>
            <Controller
              name="shipping.place_of_discharge" // this must match your form field name
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
                      setTermsOfDelivery(`CIF AT ${value}`);
                    } else if (paymentTerms === "CNF") {
                      setTermsOfDelivery(`CNF AT ${value}`);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select place of discharge" />
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
            {/* <Select
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
            </Select> */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalDestination">Final Destination</Label>
            <Controller
              name="shipping.final_destination" // this must match your form field name
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
          </div>
        </div>

        {/* Second row of fields - green highlighted in the image */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="countryOfOrigin">Country of Origin of Goods</Label>
            <Input
              id="countryOfOrigin"
              value={countryOfOrigin}
              {...register("shipping.country_of_origin", {
                required: "Country of Origin is required",
              })}
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
              {...register("shipping.origin_details", {
                required: "Origin Details are required",
              })}
              onChange={(e) => setOriginDetails(e.target.value)}
              placeholder="Enter origin details"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="countryOfFinalDestination">
              Country of Final Destination
            </Label>
            <Controller
              name="shipping.country_of_final_destination" // this must match your form field name
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="termsOfDelivery">Terms of Delivery</Label>
            <Input
              id="termsOfDelivery"
              value={termsOfDelivery}
              {...register("shipping.terms_of_delivery", {
                required: "Terms of Delivery are required",
              })}
              readonly
              disabled
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
                value={shippingForm?.payment || paymentField}
                {...register("shipping.payment", {
                  required: "Payment details are required",
                })}
                // onChange={(e) => setPaymentField(() => e.target.value)}
              />
            </div>
          </div>

          <div className="grid flex-row grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shippingMethod">Shipping Method</Label>
              <Controller
                name="shipping.shipping_method" // this must match your form field name
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="selectedCurrency">Currency</Label>
              <Controller
                name="currancy_type" // this must match your form field name
                control={control}
                rules={{ required: true }} // optional: validation rule
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencyRate">
                Current {selectedCurrency} Rate
              </Label>
              <Input
                id="currencyRate"
                value={currencyRate}
                {...register("currency_rate", {
                  required: "Currency rate is required",
                  valueAsNumber: true,
                  min: {
                    value: 0.01,
                    message: "Currency rate must be greater than 0",
                  },
                })}
                // onChange={(e) => setCurrencyRate(e.target.value)}
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
