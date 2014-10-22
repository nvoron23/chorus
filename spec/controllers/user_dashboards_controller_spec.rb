require 'spec_helper'

describe UserDashboardsController do
  let(:user) { users(:the_collaborator) }

  describe 'show' do
    before do
      log_in user
      DashboardItem::DEFAULT_MODULES.reverse.each_with_index do |name, i|
        user.dashboard_items.create!(:name => name, :location => i)
      end
    end

    it 'presents the modules in order' do
      get :show, :user_id => user.id
      decoded_response.modules.should == DashboardItem::DEFAULT_MODULES.reverse
    end

    it 'uses authorization' do
      log_in users(:no_collaborators)
      get :show, :user_id => user.id
      response.should be_forbidden
    end

    context 'when the user has no dashboard config' do
      before do
        user.dashboard_items.destroy_all
      end

      it 'uses the default' do
        get :show, :user_id => user.id
        decoded_response.modules.should == DashboardItem::DEFAULT_MODULES
      end
    end

    generate_fixture 'dashboardConfig.json' do
      get :show, :user_id => user.id
    end
  end

  describe 'create' do
    before do
      log_in user
    end

    let(:initial_module) { DashboardItem::ALLOWED_MODULES.first }
    let(:multiple_modules) { DashboardItem::ALLOWED_MODULES.sample(2) }

    it 'updates the dashboard config for the user' do
      user.dashboard_items.create!(:name => initial_module)

      post :create, :user_id => user.id, :modules => multiple_modules

      user.reload.dashboard_items.where('location > -1').order(:location).map(&:name).should == multiple_modules
    end

    context 'when the new config is invalid' do
      let(:modules) { %w(InvalidModule) }

      before do
        user.dashboard_items.create!(:name => initial_module)
        post :create, :user_id => user.id, :modules => modules
      end

      it 'does not change the existing' do
        user.reload.dashboard_items.map(&:name).should == [initial_module]
      end

      it 'returns 422' do
        response.should be_unprocessable
      end

      context 'when the new config has zero items' do
        let(:modules) { [] }

        it 'returns 422' do
          response.should be_unprocessable
          decoded_errors[:fields][:base].should have_key(:ONE_OR_MORE_REQUIRED)
        end
      end

      context 'when modules is nil' do
        let(:modules) { nil }

        it 'returns 422' do
          response.should be_unprocessable
          decoded_errors[:fields][:base].should have_key(:ONE_OR_MORE_REQUIRED)
        end
      end
    end

    it 'uses authorization' do
      log_in users(:no_collaborators)
      post :create, :user_id => user.id
      response.should be_forbidden
    end
  end
end
