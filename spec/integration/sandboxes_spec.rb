require File.join(File.dirname(__FILE__), 'spec_helper')

describe "Sandbox", :greenplum_integration do

  let(:workspace) { workspaces(:private_with_no_collaborators) }
  let(:data_source) { GreenplumIntegration.real_data_source }
  let(:database) { GreenplumIntegration.real_database }
  let(:schema) { database.schemas.first }

  before do
    login(users(:admin))
  end

  it "creates sandbox in workspace" do
    visit("#/workspaces/#{workspace.id}")
    click_link "Add a Sandbox"

    within_modal do
      #data_source
      page.find("div.data_source span.ui-selectmenu-text").should have_content("Select one")
      select_item("select[name=data_source]", data_source.id)
      page.find("div.data_source span.ui-selectmenu-text").should have_content(data_source.name)

      #database
      page.find("div.database span.ui-selectmenu-text").should have_content("Select one")
      select_item("select[name=database]", database.id)
      page.find("div.database span.ui-selectmenu-text").should have_content(database.name)

      #schema
      page.find("div.schema span.ui-selectmenu-text").should have_content("Select one")
      select_item("select[name=schema]", schema.id)
      page.find("div.schema span.ui-selectmenu-text").should have_content(schema.name)

      click_button "Add Sandbox"
    end

    workspace.reload.sandbox.should == schema
  end
end

