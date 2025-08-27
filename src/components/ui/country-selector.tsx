"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countries, Country, searchCountries } from "@/lib/countries";
import { Search, ChevronDown } from "lucide-react";

interface CountrySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function CountrySelector({
  value,
  onValueChange,
  placeholder = "Select a country",
  label = "Country",
  required = false,
  className = "",
  disabled = false,
}: CountrySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredCountries = searchCountries(searchQuery);

  const handleCountrySelect = (countryCode: string) => {
    onValueChange?.(countryCode);
    setIsOpen(false);
    setSearchQuery("");
  };

  const selectedCountry = countries.find(country => country.code === value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={`country-${label.replace(/\s+/g, '-')}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Select
        value={value}
        onValueChange={handleCountrySelect}
        open={isOpen}
        onOpenChange={setIsOpen}
        disabled={disabled}
      >
        <SelectTrigger className="w-full" id={`country-${label.replace(/\s+/g, '-')}`}>
          <SelectValue placeholder={placeholder}>
            {selectedCountry ? (
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
              </div>
            ) : (
              placeholder
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <div className="p-2 sticky top-0 bg-background border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => (
                <SelectItem
                  key={country.code}
                  value={country.code}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-lg">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-xs text-muted-foreground">{country.code}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}

interface CountryDisplayProps {
  countryCode?: string;
  className?: string;
  showCode?: boolean;
}

export function CountryDisplay({ countryCode, className = "", showCode = false }: CountryDisplayProps) {
  const country = countries.find(c => c.code === countryCode);
  
  if (!country) {
    return <span className={`text-muted-foreground ${className}`}>Not specified</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-lg">{country.flag}</span>
      <span>{country.name}</span>
      {showCode && (
        <span className="text-xs text-muted-foreground">({country.code})</span>
      )}
    </div>
  );
}