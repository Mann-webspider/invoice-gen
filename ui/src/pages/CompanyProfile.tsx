
import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCompanyProfile, saveCompanyProfile } from "@/lib/dataService";
import { CompanyProfile as CompanyProfileType } from "@/lib/types";
import { toast } from "sonner";

const CompanyProfile = () => {
  const [profile, setProfile] = useState<CompanyProfileType>({
    name: "",
    address: "",
    gstin: "",
    pan: "",
    declarationText: "",
  });

  useEffect(() => {
    const storedProfile = getCompanyProfile();
    if (storedProfile) {
      setProfile(storedProfile);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCompanyProfile(profile);
    toast.success("Company profile updated successfully");
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setProfile((prev) => ({
            ...prev,
            logo: event.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div>
      <PageHeader
        title="Company Profile"
        description="Manage your company information that appears on invoices"
      />

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            This information will be displayed on all your invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="Your Company Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Company Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  placeholder="Full company address"
                  required
                />
              </div>

              

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  name="gstin"
                  value={profile.gstin}
                  onChange={handleChange}
                  placeholder="GSTIN number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  name="pan"
                  value={profile.pan}
                  onChange={handleChange}
                  placeholder="PAN number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <div className="flex items-center gap-4">
                  {profile.logo && (
                    <div className="w-20 h-20 border rounded overflow-hidden">
                      <img
                        src={profile.logo}
                        alt="Company logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="declarationText">Declaration Text</Label>
                <Textarea
                  id="declarationText"
                  name="declarationText"
                  value={profile.declarationText}
                  onChange={handleChange}
                  placeholder="Text to be displayed at the bottom of invoices"
                  rows={4}
                />
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">
              Save Company Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyProfile;
