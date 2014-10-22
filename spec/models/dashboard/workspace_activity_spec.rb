require 'spec_helper'

describe Dashboard::WorkspaceActivity do
  let(:user) { users(:the_collaborator) }

  describe '#result by date groupings' do
    test_cases = [
      { :additional => {} },
      { :additional => { :date_group => 'day' } },
      { :additional => { :date_group => 'week', :date_parts => 4} },
      { :additional => { :date_group => 'day',  :date_parts => 7 } },
      { :additional => { :date_group => 'week', :date_parts => 12} }
    ]

    test_cases.each_with_index do |tc, i|
      it "has the correct structure for tc #{tc}" do
        @model = described_class.new({ :user => user }.merge(tc)).fetch!
        @result = @model.result

        @result.should have_key(:workspaces)
        ws = @result[:workspaces].first
        ws.should have_key(:workspace_id)
        ws.should have_key(:name)
        ws.should have_key(:summary)
        ws.should have_key(:event_count)

        @result.should have_key(:events)
        ev = @result[:events].first
        ev.should have_key(:event_count)
        ev.should have_key(:workspace_id)
        ev.should have_key(:date_part)
        ev.should have_key(:rank)

        @result.should have_key(:labels)
        l = @result[:labels].first
        l.should be_a(String)

        # Expect there to be (num workspaces)*(num date parts + 1) events
        r1 = @result[:events].length % @result[:workspaces].length
        r1.should eq(0)
      end
    end
  end
end
