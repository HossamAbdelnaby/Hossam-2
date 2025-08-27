"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { countries, Country, searchCountries } from "@/lib/countries";
import { Search, ChevronDown, Check } from "lucide-react";

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
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedCountry ? (
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
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
                <div
                  key={country.code}
                  className={`flex items-center gap-2 w-full p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                    selectedCountry?.code === country.code ? "bg-accent text-accent-foreground" : ""
                  }`}
                  onClick={() => handleCountrySelect(country.code)}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-xs text-muted-foreground">{country.code}</span>
                  {selectedCountry?.code === country.code && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
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