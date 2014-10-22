module Dashboard
  class WorkspaceActivity < DataModule
    def assign_params(params)
      a_params = params[:additional]

      @num_workspaces = 10
      @rules = {
        'day' => {
            default: 7,
            allowed: (1..31),
            history_fcn: lambda { |d| d.days.ago.localtime.at_beginning_of_day },
            label_fcn: lambda { |d| d.strftime('%b %-d') }
        },
        'week' => {
            default: 4,
            allowed: (1..52),
            history_fcn: lambda { |d| d.weeks.ago.localtime.at_beginning_of_week },
            label_fcn: lambda { |d| d.strftime('%b %-d') + ' - ' + (d + 1.week - 1.day).strftime('%b %-d') }
        }
      }

      # Validate date_group, date_parts
      if a_params.include?(:date_group)
        # Must be one of the date groupings designated above
        if !@rules.keys.include?(a_params[:date_group])
          raise ApiValidationError.new(:date_group, :invalid)
        end

        @date_group = a_params[:date_group]
      else
        @date_group = 'day'
      end

      if (a_params.include?(:date_parts))
        # Must be an integer, and within allowed range specified above.
        if !(a_params[:date_parts].to_s =~ /^\d+$/ &&
            @rules[@date_group][:allowed].include?(a_params[:date_parts].to_i))
          raise ApiValidationError.new(:date_parts, :invalid)
        end

        @date_parts = a_params[:date_parts].to_i
      else
        @date_parts = @rules[@date_group][:default]
      end
      
      @start_date = @rules[@date_group][:history_fcn].call(@date_parts)
    end

    def fetch_results
      # Get the top workspace ids since start_date
      top_workspaces = []
      top_workspace_ids = []
      created_at_adjusted = "(date_trunc('day', events.created_at at time zone 'UTC') at time zone '#{Time.now.zone}')"

      Events::Base
        .select('workspace_id, workspaces.name, ' +
                'workspaces.summary, count(*) as event_count')
        .joins(:workspace)
        .group('workspace_id, workspaces.name, workspaces.summary')
        .where('workspace_id IS NOT NULL')
        .where("#{created_at_adjusted} >= :start_date and #{created_at_adjusted} <= :end_date",
               :start_date => @start_date,
               :end_date => Time.now)
        .order('event_count desc')
        .limit(@num_workspaces)
      .each do |w|
        top_workspaces << {
          workspace_id: w.workspace_id,
          name: w.name,
          summary: w.summary,
          event_count: w.event_count
        }
        top_workspace_ids << w.workspace_id
      end

      # Get event counts grouped by @date_group and workspace
      events_by_datepart_workspace = Events::Base
        .group(:workspace_id, "(date_trunc('#{@date_group}', #{created_at_adjusted}))")
        .where('workspace_id IN (:workspace_ids)',
               :workspace_ids => top_workspace_ids)
        .where("#{created_at_adjusted} >= :start_date and #{created_at_adjusted} <= :end_date",
               :start_date => @start_date,
               :end_date => Time.now)
      .count

      # Fill in gaps and construct axis labels
      labels = []
      (0..@date_parts).each do |d|
        label = @rules[@date_group][:label_fcn].call(@rules[@date_group][:history_fcn].call(d))
        if (d == 0 && @date_group == 'day')
          labels << 'Today'
        elsif (d == 0 && @date_group == 'week')
          labels << 'This week'
        else
          labels << label
        end

        fmt_d = @rules[@date_group][:history_fcn].call(d).strftime('%F 00:00:00')
        top_workspace_ids.each do |id|
          events_by_datepart_workspace[[id, fmt_d]] ||= 0
        end
      end

      # Sort by date
      events_by_datepart_workspace = events_by_datepart_workspace.sort_by { |k,v| Date.strptime(k.last, '%F %T') }
      evs = events_by_datepart_workspace.map do |t, v|
        {
          date_part: t.last[0..."YYYY-MM-DD".length],
          workspace_id: t.first,
          event_count: v,
          rank: top_workspace_ids.find_index(t.first)
        }
      end

      return {
        workspaces: top_workspaces,
        events: evs,
        labels: labels.reverse
      }
    end
  end
end
