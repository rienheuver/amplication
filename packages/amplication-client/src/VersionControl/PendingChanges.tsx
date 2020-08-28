import React, { useMemo } from "react";
import { match } from "react-router-dom";
import { gql } from "apollo-boost";
import { useQuery } from "@apollo/react-hooks";
import { Snackbar } from "@rmwc/snackbar";
import "@rmwc/snackbar/styles";
import { groupBy, sortBy } from "lodash";
import { format } from "date-fns";

import { formatError } from "../util/error";
import * as models from "../models";
import PageContent from "../Layout/PageContent";
import FloatingToolbar from "../Layout/FloatingToolbar";
import PendingChange from "./PendingChange";
import "./PendingChanges.scss";

const CLASS_NAME = "pending-changes";

type TData = {
  pendingChanges: models.PendingChange[];
};

type Props = {
  match: match<{ application: string }>;
};

const PendingChanges = ({ match }: Props) => {
  const { application } = match.params;

  const { data, loading, error } = useQuery<TData>(GET_PENDING_CHANGES, {
    variables: {
      applicationId: application,
    },
  });

  const changesByDate = useMemo(() => {
    const groups = groupBy(data?.pendingChanges, (change) =>
      format(new Date(change.resource.updatedAt), "P")
    );
    return sortBy(Object.entries(groups), ([group, value]) => group);
  }, [data]);

  const message = !data?.pendingChanges
    ? "Loading..."
    : data?.pendingChanges.length > 1
    ? `You have ${data?.pendingChanges.length} Pending Changes`
    : data?.pendingChanges.length === 1
    ? "You have 1 Pending Change"
    : "You have no changes, keep working and come back later";

  const errorMessage = formatError(error);

  return (
    <PageContent className={CLASS_NAME} withFloatingBar>
      <main>
        <FloatingToolbar />
        <h1>Pending Changes</h1>
        {loading ? (
          <span>Loading...</span>
        ) : (
          <>
            <h3>{message}</h3>

            <div className={`${CLASS_NAME}__timeline`}>
              {changesByDate.map(([date, changes]) => (
                <>
                  <div className={`${CLASS_NAME}__timeline__date`}>{date}</div>

                  {changes.map((change) => (
                    <PendingChange key={change.resourceId} change={change} />
                  ))}
                </>
              ))}
            </div>
          </>
        )}
      </main>
      <Snackbar open={Boolean(error)} message={errorMessage} />
    </PageContent>
  );
};

export default PendingChanges;

export const GET_PENDING_CHANGES = gql`
  query pendingChanges($applicationId: String!) {
    pendingChanges(where: { app: { id: $applicationId } }) {
      resourceId
      action
      resourceType
      versionNumber
      resource {
        __typename
        ... on Entity {
          id
          displayName
          updatedAt
          lockedByUser {
            account {
              firstName
              lastName
            }
          }
        }
        ... on Block {
          id
          displayName
          updatedAt
        }
      }
    }
  }
`;