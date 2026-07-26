import { Clock } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";

function OfficeHours() {
  const { content } = useSiteContent("office-hours", {
    heading: "Office Hours",
    weekday_label: "Monday - Friday",
    weekday_hours: "9:00 AM - 6:00 PM",
    saturday_label: "Saturday",
    saturday_hours: "10:00 AM - 4:00 PM",
    sunday_label: "Sunday",
    sunday_hours: "Closed",
    note: "For urgent issues outside office hours, email us and we'll respond as soon as possible.",
  });

  const rows = [
    { label: content.weekday_label, hours: content.weekday_hours },
    { label: content.saturday_label, hours: content.saturday_hours },
    { label: content.sunday_label, hours: content.sunday_hours },
  ];

  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8" data-aos="fade-up">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/15 p-3 text-violet-300">
              <Clock size={22} />
            </div>
            <h2 className="text-xl font-bold">{content.heading}</h2>
          </div>

          <div className="divide-y divide-white/10">
            {rows.map((row, index) => (
              <div key={index} className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-300">{row.label}</span>
                <span className="text-sm font-semibold text-white">{row.hours}</span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-400">{content.note}</p>
        </div>
      </div>
    </section>
  );
}

export default OfficeHours;