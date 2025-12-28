-- One-on-One meetings
CREATE TABLE one_on_ones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  scheduled_at TIMESTAMPTZ NOT NULL,

  -- Notes
  agenda TEXT,
  manager_notes TEXT, -- Private to manager
  shared_notes TEXT, -- Visible to both
  action_items JSONB, -- Array of action items

  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),

  -- Transcript
  transcript TEXT,
  transcript_file_url TEXT,

  -- Document URL (deprecated - use one_on_one_documents)
  document_url TEXT,

  -- Calendar integration
  google_event_id TEXT,
  outlook_event_id TEXT,
  google_calendar_synced BOOLEAN DEFAULT false,
  google_event_url TEXT,
  last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_one_on_ones_manager ON one_on_ones(manager_id);
CREATE INDEX idx_one_on_ones_employee ON one_on_ones(employee_id);
CREATE INDEX idx_one_on_ones_scheduled ON one_on_ones(scheduled_at);
CREATE INDEX idx_one_on_ones_status ON one_on_ones(status);

CREATE TRIGGER update_one_on_ones_updated_at
  BEFORE UPDATE ON one_on_ones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- One-on-One Documents (linked docs, can be recurring)
CREATE TABLE one_on_one_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  one_on_one_id UUID NOT NULL REFERENCES one_on_ones(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  url TEXT NOT NULL,

  -- Recurring documents show in all future 1:1s between these people
  is_recurring BOOLEAN DEFAULT false,
  manager_id UUID NOT NULL, -- For recurring lookup
  employee_id UUID NOT NULL, -- For recurring lookup

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_one_on_one_docs_one_on_one ON one_on_one_documents(one_on_one_id);
CREATE INDEX idx_one_on_one_docs_recurring ON one_on_one_documents(manager_id, employee_id) WHERE is_recurring = true;

CREATE TRIGGER update_one_on_one_documents_updated_at
  BEFORE UPDATE ON one_on_one_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
