import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useLoading } from "../../contexts/LoaderContext";
import shiftService from "../../api/services/admin/shiftService";

const DEFAULT_COLOR = "#2563eb";
const DEFAULT_BORDER = "#1e40af";

const Schedule = () => {
  const [events, setEvents] = useState([]);
  const { show, hide, loading } = useLoading();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const mapShift = (s = {}, idx) => {
      const employeeName =
        s.employee_id?.name ??
        s.employee?.name ??
        s.employee_name ??
        s.title ??
        `Shift ${idx + 1}`;

      const start =
        s.start_date_time ??
        (s.date ? `${s.date}T${s.from ?? "09:00"}` : null) ??
        null;

      const end =
        s.end_date_time ??
        (s.date ? `${s.date}T${s.to ?? "17:00"}` : null) ??
        null;

      return {
        id: s._id ?? s.id ?? String(idx),
        title: employeeName,
        start,
        end,
        allDay: Boolean(s.allDay),
        backgroundColor: s.color ?? DEFAULT_COLOR,
        borderColor: s.color ?? DEFAULT_BORDER,
        extendedProps: { raw: s, shiftTitle: s.title },
      };
    };

    (async () => {
      setError(null);
      try {
        show();
        const res = await shiftService.getBranchShifts();
        const shifts = res?.data?.data ?? [];
        if (!cancelled) setEvents(Array.isArray(shifts) ? shifts.map(mapShift) : []);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load shifts");
          setEvents([]);
        }
      } finally {
        hide();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEventClick = (info) => {
    const ev = info.event;
    const raw = ev.extendedProps?.raw ?? {};
    const fmt = (d) => (d ? d.toLocaleString() : "");
    alert(
      `${ev.title}${raw.shiftTitle ? ` (${raw.shiftTitle})` : ""}\nStart: ${fmt(
        ev.start
      )}\nEnd: ${fmt(ev.end)}`
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Branch Schedule</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full border-4 border-t-blue-600 border-gray-200 animate-spin" />
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="timeGridDay"
            events={events}
            eventDisplay="block"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridDay,dayGridWeek,dayGridMonth",
            }}
            eventClick={handleEventClick}
            height="auto"
          />
        )}
      </div>
    </div>
  );
};

export default Schedule;
