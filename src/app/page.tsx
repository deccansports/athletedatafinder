
"use client";

import type { ChangeEvent } from "react";
import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, Info, AlertTriangle, ListX } from "lucide-react";
import { searchAthleteData, getEventListForClient, type AthleteInfo, type SearchResult, type EventForClient, type EventListResult } from "./actions";
import { useToast } from "@/hooks/use-toast";

export default function AthleteSearchPage() {
  const [eventsList, setEventsList] = useState<EventForClient[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [selectedEventId, setSelectedEventId] = useState<string>(""); // Stores the event index as string
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [results, setResults] = useState<AthleteInfo[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  const [isSearching, startSearchTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchEvents() {
      setIsLoadingEvents(true);
      setEventsError(null);
      const result: EventListResult = await getEventListForClient();
      if (result.error) {
        setEventsError(result.error);
        setEventsList([]);
        toast({
          title: "Failed to Load Events",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.events) {
        setEventsList(result.events);
        if (result.events.length > 0) {
          setSelectedEventId(result.events[0].value); // Default to first event's index
        } else {
           toast({
            title: "No Events Available",
            description: "There are no events configured for selection.",
            variant: "default",
          });
        }
      }
      setIsLoadingEvents(false);
    }
    fetchEvents();
  }, [toast]);

  const handleSearch = async () => {
    if (!selectedEventId) {
      setSearchError("Please select an event.");
      setResults([]);
      setHasSearched(false);
      return;
    }
    if (!searchQuery.trim()) {
      setSearchError("Please enter a search term.");
      setResults([]);
      setHasSearched(false);
      return;
    }
    setSearchError(null);
    setHasSearched(true);

    startSearchTransition(async () => {
      // selectedEventId is the index string
      const result: SearchResult = await searchAthleteData(selectedEventId, searchQuery);
      if (result.error) {
        setSearchError(result.error);
        setResults([]);
        toast({
          title: "Search Failed",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.data) {
        setResults(result.data);
        if (result.data.length === 0) {
           toast({
            title: "No Results",
            description: "No athletes found matching your query.",
            variant: "default",
          });
        } else {
           toast({
            title: "Search Successful",
            description: `Found ${result.data.length} athlete(s).`,
            variant: "default",
          });
        }
      }
    });
  };
  
  useEffect(() => {
    setResults([]);
    setSearchError(null);
    setHasSearched(false);
  }, [selectedEventId, searchQuery]);


  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8 selection:bg-accent selection:text-accent-foreground">
      <Card className="w-full max-w-3xl shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-card-foreground text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold text-center ">Athlete Data Finder</CardTitle>
          <CardDescription className="text-center text-primary-foreground/80 pt-1">
            Select an event and search by Name, Bib Number, Phone, or Email.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            {isLoadingEvents && (
              <div className="flex items-center justify-center h-12 rounded-lg shadow-sm border bg-muted">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading events...</span>
              </div>
            )}
            {eventsError && !isLoadingEvents && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-2 text-sm shadow">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>{eventsError}</p>
              </div>
            )}
            {!isLoadingEvents && !eventsError && eventsList.length === 0 && (
                 <div className="flex items-center justify-center h-12 rounded-lg shadow-sm border bg-muted">
                    <ListX className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">No events available for selection.</span>
                </div>
            )}
            {!isLoadingEvents && !eventsError && eventsList.length > 0 && (
              <Select 
                value={selectedEventId} 
                onValueChange={setSelectedEventId}
                disabled={isLoadingEvents || eventsList.length === 0}
              >
                <SelectTrigger className="w-full text-base h-12 rounded-lg shadow-sm">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-lg">
                  <SelectGroup>
                    <SelectLabel>Events</SelectLabel>
                    {eventsList.map((event) => (
                      <SelectItem key={event.value} value={event.value} className="text-base py-2">
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Input
                type="text"
                id="searchInput"
                placeholder="Enter search term..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="flex-grow text-base h-12 rounded-lg shadow-sm"
                aria-label="Search by Name, Bib, Phone, or Email"
                disabled={isLoadingEvents || eventsList.length === 0}
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || isLoadingEvents || eventsList.length === 0 || !selectedEventId} 
                className="w-full sm:w-auto h-12 rounded-lg shadow-md bg-primary hover:bg-accent focus-visible:ring-ring text-base font-semibold transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                {isSearching ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Search className="mr-2 h-5 w-5" />
                )}
                Search
              </Button>
            </div>
          </div>

          {searchError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-2 text-sm shadow">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{searchError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isSearching && (
         <div className="w-full max-w-3xl mt-6 p-6 bg-card rounded-xl shadow-2xl text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-3" />
            <p className="text-lg font-medium text-muted-foreground">Searching for athletes...</p>
         </div>
      )}

      {!isSearching && hasSearched && results.length === 0 && !searchError && (
        <Card className="w-full max-w-3xl mt-6 shadow-2xl rounded-xl">
          <CardContent className="p-10 text-center">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No Results Found</p>
            <p className="text-sm text-muted-foreground/80">
              No athletes matched your search criteria for the selected event.
            </p>
          </CardContent>
        </Card>
      )}

      {!isSearching && results.length > 0 && (
        <div className="w-full max-w-3xl mt-6 bg-card rounded-xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-card-foreground">Search Results ({results.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/70">
                  <TableHead className="w-[120px] px-4 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">Bib Number</TableHead>
                  <TableHead className="px-4 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">Name</TableHead>
                  <TableHead className="px-4 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">Ticket Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((athlete, index) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors duration-150">
                    <TableCell className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{athlete.bibNumber}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-foreground whitespace-nowrap font-medium">{athlete.name}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{athlete.ticketName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           <CardFooter className="p-4 border-t bg-muted/30 text-xs text-muted-foreground">
            Displaying {results.length} athlete(s).
          </CardFooter>
        </div>
      )}
    </div>
  );
}
