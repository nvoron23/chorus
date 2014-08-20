module Dashboard
  def self.build(params)
    case params[:entity_type]
      when 'site_snapshot' then SiteSnapshot
      when 'recent_workfiles' then RecentWorkfiles
      else raise ApiValidationError.new(:entity_type, :invalid)
    end.new(params)
  end

  class DataModule

    attr_accessor :entity_type, :result

    def initialize(params)
      @entity_type = params[:entity_type]
      assign_params(params)
    end

    def fetch!
      @result = fetch_results

      self
    end

    private

    def fetch_results; end

    def assign_params(params) end
  end
end
