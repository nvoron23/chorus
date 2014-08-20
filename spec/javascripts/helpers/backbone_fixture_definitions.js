window.BackboneFixtureDefinitions = {
    activity: {
        unique: [ "id" ],

        children: {
            chorusViewChanged: {},
            chorusViewCreatedFromDataset: {},
            chorusViewCreatedFromWorkfile: {},
            credentialsInvalid: {},
            datasetImportFailedWithModelErrors: {},
            dataSourceCreated: {},
            dataSourceChangedName: {},
            dataSourceChangedOwner: {},
            dataSourceDeleted: {},
            fileImportCreated: {},
            fileImportFailed: {},
            fileImportSuccess: {},
            gnipDataSourceCreated: {},
            gnipStreamImportCreated: {},
            gnipStreamImportFailed: {},
            gnipStreamImportSuccess: {},
            hdfsDatasetCreated: {},
            hdfsDatasetUpdated: {},
            hdfsDataSourceCreated: {},
            hdfsDataSourceChangedName: {},
            hdfsFileExtTableCreated: {},
            hdfsDatasetExtTableCreated: {},
            hdfsDirectoryExtTableCreated: {},
            hdfsImportFailed: {},
            hdfsImportSuccess: {},
            hdfsPatternExtTableCreated: {},
            importScheduleDeleted: {},
            importScheduleUpdated: {},
            insightOnGreenplumDataSource: {},
            insightOnWorkspace: {},
            membersAdded: {},
            noteOnDatasetCreated: {},
            noteOnGreenplumDataSource: {},
            noteOnOracleDataSource: {},
            noteOnGnipDataSourceCreated: {},
            noteOnGreenplumDataSourceCreated: {},
            noteOnHdfsDataSourceCreated: {},
            noteOnHdfsFileCreated: {},
            noteOnWorkfileCreated: {},
            noteOnWorkspaceCreated: {},
            noteOnWorkspaceDatasetCreated: {},
            privateWorkspaceCreated: {},
            publicWorkspaceCreated: {},
            sandboxAdded: {},
            schemaImportCreated: {},
            schemaImportFailed: {},
            schemaImportSuccess: {},
            sourceTableCreated: {},
            tableauWorkbookPublished: {},
            tableauWorkfileCreated: {},
            userCreated: {},
            viewCreated: {},
            workfileCreated: {},
            workfileResult: {},
            workfileUpgradedVersion: {},
            workfileVersionDeleted: {},
            workFlowUpgradedVersion: {},
            workspaceChangeName: {},
            projectStatusChanged: {},
            workspaceDeleted: {},
            workspaceMakePublic: {},
            workspaceMakePrivate: {},
            workspaceArchived: {},
            workspaceUnarchived: {},
            workspaceImportCreated: {},
            workspaceImportFailed: {},
            workspaceImportSuccess: {},
            jobSucceeded: {},
            jobFailed: {},
            jobDisabled: {}
        }
    },

    boxplotTask: {},

    comment: { model: "Comment", unique: ['id'] },

    config: {},

    license: {},

    csvImport: {  model: "CSVImport" },

    csvImportSet: {
        collection: "WorkspaceImportSet"
    },

    database: { unique: ["id"] },

    pgDatabase: { model: 'Database' },

    pgSchema: {
        unique: ['id'],
        model: 'Schema'
    },

    pgDataset: {
        unique: ["id"],
        model: 'Dataset'
    },

    dashboard: {
        children: {
            siteSnapshot: {
                model: 'DashboardData'
            },
            recentWorkfiles: {
                model: 'DashboardData'
            }
        }
    },

    dashboardConfig: {},

    databaseColumn: {},

    databaseColumnSet: {},

    dataPreviewTaskResults: {
        model: "DataPreviewTask"
    },

    dataset: { unique: [ "id" ] },

    datasetImportability: {},

    datasetImportabilityForUnimportableDataset: {},

    datasetImportScheduleSet: {},

    workspaceImportSet: {},

    datasetStatisticsTable: {
        model: "DatasetStatistics"
    },

    datasetStatisticsView: {
        model: "DatasetStatistics"
    },

    hdfsDatasetStatistics: { model: "DatasetStatistics" },

    draft: {},

    forbiddenDataSource: {},

    frequencyTask: {},

    frequencyTaskWithErrors: {
        model: 'FrequencyTask'
    },

    gnipDataSource: { unique: ["id"] },

    gpdbDataSource: { unique: [ "id" ] },

    oracleDataSource: { unique: [ "id" ] },

    hdfsDataSource: { unique: ["id"] },

    jdbcDataSource: { unique: ["id"] },

    pgDataSource: { unique: ["id"] },

    heatmapTask: {},

    hdfsEntrySet: {},

    hdfsContentsError: {},

    hdfsFile: {  unique: ["id"], model: "HdfsEntry" },

    hdfsDir: {  unique: ["id"], model: "HdfsEntry" },

    hdfsEntryStatistics: {},

    histogramTask: {},

    image: {},

    invalidCredentialsError: {},

    job: {},

    jobSet: {},

    jobResult: {},

    milestoneSet: {},

    dataSourceAccount: { unique: ["id"] },

    dataSourceAccountSet: {},

    dataSourceDetails: {
        model: 'DataSourceUsage'
    },

    dataSourceDetailsWithoutPermission: {
        model: 'DataSourceUsage'
    },

    kaggleUserSet: { unique: ["id"] },

    notification: {
        unique: ["id"]
    },

    notificationSet: {},

    jdbcDataset: {
        unique: ["id"],
        model: 'Dataset'
    },

    oracleDataset: {
        unique: ["id"],
        model: 'Dataset'
    },

    oracleSchema: {
        unique: ['id'],
        model: 'Schema'
    },

    oracleSchemaSet: {
        collection: "SchemaSet"
    },

    schema: { unique: [ "id", "database.id", "database.dataSource.id" ] },

    schemaDatasetSet: { unique: ["id"] },

    schemaFunctionSet: {},

    schemaSet: { unique: [ "id" ] },

    searchResult: {},

    tagSearchResult: {},

    session: {},

    emptySearchResult: {
        model: "SearchResult"
    },

    searchResultInWorkspace: {
        model: "SearchResult"
    },

    searchResultInWorkspaceWithEntityTypeWorkfile: {
        model: "SearchResult"
    },

    searchResultWithEntityTypeUser: {
        model: "SearchResult"
    },

    searchResultWithAttachmentOnDataSourceNote: {
        model: "SearchResult"
    },

    searchResultWithAttachmentOnWorkspaceNote: {
        model: "SearchResult"
    },

    searchResultWithAttachmentOnWorkfileNote: {
        model: "SearchResult"
    },

    searchResultWithAttachmentOnDatasetNote: {
        model: "SearchResult"
    },

    searchResultWithAttachmentOnHdfsNote: {
        model: "SearchResult"
    },

    searchResultWithAttachmentOnHadoopNote: {
        model: "SearchResult"
    },

    searchResultWithAttachmentOnWorkspaceDatasetNote: {
        model: "SearchResult"
    },

    status: {},

    tableauWorkbook: {
        unique: [ "id" ]
    },

    tagSet: {

    },

    test: {
        model:   "User",
        unique:  [ "id" ],

        children: {
            noOverrides: {},
            withOverrides: { model: "Workspace" }
        }
    },

    timeseriesTask: {},

    typeAheadSearchResult: {},

    upload: {},

    user: { unique: [ "id" ] },

    userSet: { unique: [ "id" ] },

    userWithErrors: { model: 'User' },

    workfile: {
        unique: [ "id" ],
        children: {
            alpine: {
                model: 'AlpineWorkfile'
            },
            alpineHdfsDatasetFlow: {
                model: 'AlpineWorkfile'
            },
            alpineMultiDataSourceFlow: {
                model: 'AlpineWorkfile'
            },
            sql: {},
            binary: {},
            image: {},
            text: {},
            tableau: {}
        }
    },

    workfileExecutionResults: {
        model: "WorkfileExecutionTask"
    },

    workfileExecutionResultsWithWarning: {
        model: "WorkfileExecutionTask"
    },

    workfileExecutionResultsEmpty: {
        model: "WorkfileExecutionTask"
    },

    workfileExecutionError: {
        model: "WorkfileExecutionTask"
    },

    workfileSet: {},

    workfileVersionSet: {},

    workfileVersion: { unique: ['id']},

    workspace: { unique: [ "id" ] },
    project: {
        unique: [ "id" ],
        model: 'Workspace'
    },

    workspaceDataset: {
        unique: ["id"],
        children: {
            chorusView: {
                model: 'ChorusView'
            },
            datasetTable: {},
            datasetView: {},
            sourceTable: {},
            sourceView: {},
            jdbcTable: {},
            hdfsDataset: {
                model: 'HdfsDataset'
            }
        }
    },

    workspaceSet: { unique: [ "id" ] }
};
