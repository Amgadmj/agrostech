"use client";

import React from "react";
import { EvidenceAuditTable, TimelineEvent, FraudVectorId, EVIDENCE_EVENTS } from "./EvidenceAuditTable";

export type { TimelineEvent, FraudVectorId };
export { EVIDENCE_EVENTS };

interface RedFlagTimelineProps {
  onTriggerStrike?: () => void;
  onSelectEvent?: (event: TimelineEvent) => void;
}

export const RedFlagTimeline: React.FC<RedFlagTimelineProps> = ({
  onTriggerStrike,
  onSelectEvent,
}) => {
  return (
    <EvidenceAuditTable
      onTriggerStrike={onTriggerStrike}
      onSelectEvent={onSelectEvent}
    />
  );
};

export default RedFlagTimeline;
