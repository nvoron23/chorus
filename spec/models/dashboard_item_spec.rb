require 'spec_helper'

describe DashboardItem do
  describe 'validations' do
    it { should ensure_inclusion_of(:name).in_array(%w(SiteSnapshot ProjectCardList ActivityStream RecentWorkfiles)) }
  end
end
