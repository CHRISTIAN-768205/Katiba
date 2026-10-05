import CalendarEvent from "../models/CalendarEvent.js";

/**
 * True if the advocate already has an upcoming event overlapping [startTime, endTime).
 * excludeRequestId lets a request's own (about-to-be-updated) event skip checking against itself
 * when re-confirming after a reschedule.
 */
export async function hasConflict(advocateId, startTime, endTime, excludeRequestId = null) {
  const filter = {
    advocateId,
    status: "upcoming",
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeRequestId) filter.requestId = { $ne: excludeRequestId };
  const conflict = await CalendarEvent.findOne(filter);
  return !!conflict;
}

/**
 * Creates (or updates, if one already exists for this request - e.g. after a reschedule)
 * the CalendarEvent for a just-confirmed consultation request.
 */
export async function upsertCalendarEvent(request) {
  const startTime = request.confirmedDate;
  const endTime = new Date(startTime.getTime() + request.durationMinutes * 60 * 1000);

  return CalendarEvent.findOneAndUpdate(
    { requestId: request._id },
    {
      requestId: request._id,
      advocateId: request.advocateId,
      clientId: request.clientId,
      startTime,
      endTime,
      consultationType: request.consultationType,
      locationOrLink: request.locationOrLink,
      status: "upcoming",
    },
    { upsert: true, new: true }
  );
}

/** Marks the calendar event for a request as cancelled (used when a request is cancelled/rejected after being confirmed). */
export async function cancelCalendarEvent(requestId) {
  await CalendarEvent.findOneAndUpdate({ requestId }, { status: "cancelled" });
}

/** Marks the calendar event for a request as completed. */
export async function completeCalendarEvent(requestId) {
  await CalendarEvent.findOneAndUpdate({ requestId }, { status: "completed" });
}