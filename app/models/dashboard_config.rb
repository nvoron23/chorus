class DashboardConfig

  attr_reader :user

  def initialize(user)
    @user = user
  end

  def dashboard_items
    items = user.dashboard_items.where('location > -1').order(:location).map &:name

    if items.empty?
      items = DashboardItem::DEFAULT_MODULES
    end

    items
  end

  def update(modules)
    raise ApiValidationError.new(:base, :ONE_OR_MORE_REQUIRED) unless modules.present?

    User.transaction do
      available_modules = DashboardItem::ALLOWED_MODULES - modules
      modules.each_with_index do |name, i|
        option_string = user.dashboard_items.select(:options).where(:name => name).map(&:options).join(',')
        user.dashboard_items.where(:name => name).destroy_all
        user.dashboard_items.create!(:name => name, :location => i, :options => option_string)
      end
      available_modules.each_with_index do |name|
        option_string = user.dashboard_items.select(:options).where(:name => name).map(&:options).join(',')
        user.dashboard_items.where(:name => name).destroy_all
        user.dashboard_items.create!(:name => name, :location => -1, :options => option_string)
      end
    end
  end

  def set_options(module_name, option_string)
    User.transaction do
      user.dashboard_items.where(:name => module_name).update_all(:options => option_string)
    end
  end

  def get_options(module_name)
    User.transaction do
      user.dashboard_items.where(:name => module_name).select(:options)
    end
  end
end
