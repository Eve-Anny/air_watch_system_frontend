import { useEffect, useState } from "react";
import { Header } from "./components/layout/Header";
import { DeviceSelector } from "./components/DeviceSelector";
import { StatusCard } from "./components/StatusCard";
import { PollutantBreakdown } from "./components/PollutantBreakdown";
import { TrendChart } from "./components/TrendChart";
import { AlertsPanel } from "./components/AlertsPanel";
import { ForecastPanel } from "./components/ForecastPanel";
import { MeasurementsTable } from "./components/MeasurementsTable";
import { ManualReadingForm } from "./components/ManualReadingForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  useActiveAlerts,
  useDevices,
  useForecast,
  useHistoricalReadings,
  usePaginatedReadings,
  useStatus,
} from "./api/hooks";

export default function App() {
  const devices = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [trendRangeHours, setTrendRangeHours] = useState(24);

  // Auto-select the first device once the list loads, if nothing's selected yet.
  useEffect(() => {
    if (!selectedDeviceId && devices.data && devices.data.length > 0) {
      setSelectedDeviceId(devices.data[0].device_id);
    }
  }, [devices.data, selectedDeviceId]);

  useEffect(() => {
    setTablePage(0);
    setShowArchived(false);
  }, [selectedDeviceId]);

  const status = useStatus(selectedDeviceId);
  const alerts = useActiveAlerts(selectedDeviceId);
  const readings = useHistoricalReadings(selectedDeviceId, trendRangeHours);
  const forecast = useForecast(selectedDeviceId, 6);
  const measurementsPage = usePaginatedReadings(selectedDeviceId, tablePage, 10, showArchived);

  const activeAlertCount = alerts.data?.length ?? 0;

  function refetchAfterManualSubmit() {
    status.refetch();
    alerts.refetch();
    readings.refetch();
    measurementsPage.refetch();
  }

  function handleToggleShowArchived(show: boolean) {
    setShowArchived(show);
    setTablePage(0);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isOffline={!!devices.error} />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <DeviceSelector devices={devices} selectedDeviceId={selectedDeviceId} onSelect={setSelectedDeviceId} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <StatusCard status={status} />
          </div>
          <div className="lg:col-span-3">
            <PollutantBreakdown status={status} />
          </div>
        </div>

        <Tabs defaultValue="trend">
          <TabsList>
            <TabsTrigger value="trend">Trend &amp; History</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts{activeAlertCount > 0 ? ` (${activeAlertCount})` : ""}
            </TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="space-y-4">
            <TrendChart readings={readings} rangeHours={trendRangeHours} onRangeChange={setTrendRangeHours} />
            <MeasurementsTable
              readings={measurementsPage}
              page={tablePage}
              onPageChange={setTablePage}
              showArchived={showArchived}
              onToggleShowArchived={handleToggleShowArchived}
            />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsPanel alerts={alerts} />
          </TabsContent>

          <TabsContent value="forecast">
            <ForecastPanel forecast={forecast} />
          </TabsContent>

          <TabsContent value="manual">
            <ManualReadingForm deviceId={selectedDeviceId} onSubmitted={refetchAfterManualSubmit} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
