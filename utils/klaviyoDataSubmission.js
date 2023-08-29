import Queue from "bull";
import { formIds } from "../controllers/submissionController.js";
import fetch from "node-fetch";
import { connection } from "../server.js";

const klaviyoQueue = new Queue("klaviyo");

klaviyoQueue.process(async (job) => {
  try {
    let kapikeys;
    const sql2 = `SELECT klaviyoSetting FROM shopify_sessions WHERE shop = ?`;

    connection.query(sql2, [job.data.data.shopname], function (err, result) {
      if (err) {
        console.log(err);
      } else {
        const jsonObject = JSON.parse(result[0].klaviyoSetting);
        kapikeys = jsonObject;
      }
    });

    const [rows, fields] = await connection
      .promise()
      .execute(
        `SELECT componentJSON,klaviyoIntegration FROM forms WHERE id=?`,
        [formIds]
      );

    for (const row of rows) {
      const klaviyoData = JSON.parse(row.klaviyoIntegration);
      const componentJSON = JSON.parse(row.componentJSON);
      const properties = {};
      const matchedObjects = {};

      componentJSON.forEach((obj) => {
        const label = obj.label;
        const value = job.data.data.fields[label];

        if (value !== undefined) {
          matchedObjects[obj.id] = value;
        }
        if (obj.type === "hidden") {
          obj.value.map((item) => {
            matchedObjects[item.label] = job.data.data.fields[item.label];
          });
        }
      });

      const fieldIds = Object.keys(matchedObjects);

      Object.values(klaviyoData.klaviyoListMapping).forEach((mapping) => {
        const formFieldId = mapping.form_field;
        const klaviyoField = mapping.klaviyo_field;

        if (mapping.is_fixed && mapping.is_input !== "") {
          // Field has a fixed value, assign it directly
          properties[klaviyoField] = mapping.is_input;
        } else {
          // Field does not have a fixed value, retrieve from form fields
          if (fieldIds.includes(formFieldId.replace(".", "_"))) {
            const formFieldValue =
              matchedObjects[formFieldId.replace(".", "_")];
            if (klaviyoField === "email" || klaviyoField === "Email") {
              // If the klaviyoField is 'email', store the value in properties and use it as the email
              properties[klaviyoField] = formFieldValue;
            } else {
              // For other fields, store their values normally
              properties[klaviyoField] = formFieldValue;
            }
          }
        }
      });


      let listId, listName, matchingList;
      let listNames = [];
      if (job.data.listMethod === "singlelist") {
        console.log("single");
        listId = job.data.defaultOption;
      } else {
        const listNameOptions = {
          method: "GET",
          headers: {
            accept: "application/json",
            revision: "2023-02-22",
            Authorization: `Klaviyo-API-Key ${kapikeys.klaviyoApiprivateKey}`,
          },
        };
        let nextPage = "https://a.klaviyo.com/api/lists/";
        while (nextPage) {
          const responsed = await fetch(nextPage, listNameOptions);
          const res = await responsed.json();
          const pageListNames = res.data.map((list) => list.attributes.name);
          listNames.push(...pageListNames);
          nextPage = res.next || null;
          const hiddenFieldLabel = job.data.hiddenField;
          const modifiedHiddenFieldLabel = hiddenFieldLabel.replace(".", "_");
          if (
            hiddenFieldLabel &&
            job.data.data.fields.hasOwnProperty(modifiedHiddenFieldLabel)
          ) {
            listName = job.data.data.fields[modifiedHiddenFieldLabel];
          } else {
            listName = job.data.data.formtitle;
          }
          matchingList = res.data.find(
            (list) => list.attributes.name === listName
          );
        }
        if (!matchingList) {
          console.log("Creating List");
          const listnameoptions = {
            method: "POST",
            headers: {
              accept: "application/json",
              revision: "2023-02-22",
              "content-type": "application/json",
              Authorization: `Klaviyo-API-Key ${kapikeys.klaviyoApiprivateKey}`,
            },
            body: JSON.stringify({
              data: { type: "list", attributes: { name: listName } },
            }),
          };

          try {
            const response = await fetch(
              "https://a.klaviyo.com/api/lists/",
              listnameoptions
            );
            const data = await response.json();
            console.log("list created", data);
            listId = data.data.id;
          } catch (err) {
            console.error(err);
          }
        } else {
          listId = matchingList.id;
        }
      }
      const url = `https://a.klaviyo.com/api/lists/${listId}/profiles/?page[size]=100`;
      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          revision: "2023-02-22",
          Authorization: `Klaviyo-API-Key ${kapikeys.klaviyoApiprivateKey}`,
        },
      };

      const response = await fetch(url, options);
      const profiles = await response.json();
      const emails = profiles.data.map((profile) => profile.attributes.email);

      if (
        emails.includes(properties.Email) ||
        emails.includes(properties.email)
      ) {
        console.log("Duplicate Emails not allowed in klaviyo");
      } else {
        const url = `https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/`;
        const options = {
          method: "POST",
          headers: {
            accept: "application/json",
            revision: "2023-02-22",
            "content-type": "application/json",
            Authorization: `Klaviyo-API-Key ${kapikeys.klaviyoApiprivateKey}`,
          },
          body: JSON.stringify({
            data: {
              type: "profile-subscription-bulk-create-job",
              attributes: {
                list_id: listId,
                custom_source: "Clients Subscription",
                subscriptions: [
                  {
                    email: properties.Email || properties.email,
                  },
                ],
              },
            },
          }),
        };
        const response = await fetch(url, options);
        const data = await response.text();
        let pro;
        const urls = `https://a.klaviyo.com/api/lists/${listId}/profiles/?page[size]=100`;
        const optionss = {
          method: "GET",
          headers: {
            accept: "application/json",
            revision: "2023-02-22",
            Authorization: `Klaviyo-API-Key ${kapikeys.klaviyoApiprivateKey}`,
          },
        };
        const responses = await fetch(urls, optionss);
        const profiless = await responses.json();
        pro = profiless.data;
        const lastProfile = pro[pro.length - 1];
        const lastProfileId = lastProfile?.id;
        const lastProfileEmails = lastProfile?.attributes?.email;
        if (
          (lastProfileId !== null && lastProfileEmails == properties.Email) ||
          properties.email
        ) {
          const url = `https://a.klaviyo.com/api/profiles/${lastProfileId}`;
          const option = {
            method: "PATCH",
            headers: {
              accept: "application/json",
              revision: "2023-02-22",
              "content-type": "application/json",
              Authorization: `Klaviyo-API-Key ${kapikeys.klaviyoApiprivateKey}`,
            },
            body: JSON.stringify({
              data: {
                type: "profile",
                id: lastProfileId,
                attributes: {
                  email: properties.email || properties.Email,
                  properties: properties,
                },
              },
            }),
          };
          const res = await fetch(url, option);
          const dat = await res.json();
        }
        const lastProfiles = pro[pro.length - 1];
        const lastProfileEmail = lastProfiles.attributes.email;

        if (properties.Subscribed === false) {
          const opt = {
            method: "POST",
            headers: {
              accept: "application/json",
              revision: "2023-02-22",
              "content-type": "application/json",
              Authorization: `Klaviyo-API-Key ${kapikeys.klaviyoApiprivateKey}`,
            },
            body: JSON.stringify({
              data: {
                type: "profile-unsubscription-bulk-create-job",
                attributes: {
                  list_id: listId,
                  emails: lastProfileEmail,
                },
              },
            }),
          };

          fetch(
            "https://a.klaviyo.com/api/profile-unsubscription-bulk-create-jobs/",
            opt
          )
            .then((response) => console.log("Unsubscribe Response", response.status, response.statusText))
            .catch((err) => console.error("Unsubscribe Error", err));
        }
      }
    }
  } catch (error) {
    console.error("End Catch Block Error:", error);
  }
});

klaviyoQueue
  .on("completed", (job) => {
    console.log(`Klaviyo Job ${job.id} completed successfully`);
  })
  .on("failed", (job, err) => {
    console.log(`Klaviyo Job ${job.id} failed with error ${err}`);
  });

klaviyoQueue.isReady().then(() => {
  console.log("Klaviyo Job worker is running");
});

export default klaviyoQueue;
